/*
 * RF Attendance System - ESP8266 RFID Reader Firmware
 * =====================================================
 * Hardware Required:
 *   - NodeMCU ESP8266 (or similar)
 *   - MFRC522 RFID Module
 *   - Buzzer (optional, for feedback)
 *
 * Wiring (MFRC522 to NodeMCU):
 *   SDA  -> D4 (GPIO 2)
 *   SCK  -> D5 (GPIO 14)
 *   MOSI -> D7 (GPIO 13)
 *   MISO -> D6 (GPIO 12)
 *   GND  -> GND
 *   RST  -> D3 (GPIO 0)
 *   3.3V -> 3.3V
 *
 * Libraries Required (install via Library Manager):
 *   - ESP8266WiFi (built-in)
 *   - ESP8266HTTPClient (built-in)
 *   - MFRC522 by GithubCommunity
 *   - ArduinoJson by Benoit Blanchon
 */

#include <ArduinoJson.h>
#include <ESP8266HTTPClient.h>
#include <ESP8266WiFi.h>
#include <MFRC522.h>
#include <SPI.h>
#include <WiFiClient.h>

// ===== CONFIGURATION =====
const char *WIFI_SSID = "1";              // Your WiFi name
const char *WIFI_PASSWORD = "GJ@01@3545"; // Your WiFi password
const char* SERVER_URL    = "http://192.168.33.178:3000/api/attendance/mark";
const char *DEVICE_ID = "ESP01";
const char *SECRET_KEY = "esp8266_secret_key_2024";
// =========================

// RFID Pins
#define SS_PIN D4
#define RST_PIN D3

// Feedback pins
#define BUZZER_PIN D8
#define LED_GREEN D1
#define LED_RED D2

MFRC522 rfid(SS_PIN, RST_PIN);
WiFiClient wifiClient;

unsigned long lastCardTime = 0;
const unsigned long DEBOUNCE_MS = 3000;

// ─── UID DISCOVERY MODE ───────────────────────────────────────
// Set to true to ONLY print UIDs — useful for finding your card UIDs
// Set back to false once you have registered the UIDs in the database
const bool UID_DISCOVERY_MODE = false;
// ─────────────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);

  Serial.println();
  Serial.println("╔══════════════════════════════════════╗");
  Serial.println("║    RF Attendance System  v2.0.0      ║");
  Serial.println("╚══════════════════════════════════════╝");
  Serial.println("Device ID : " + String(DEVICE_ID));
  Serial.println("Server    : " + String(SERVER_URL));

  if (UID_DISCOVERY_MODE) {
    Serial.println();
    Serial.println("┌─────────────────────────────────────┐");
    Serial.println("│  UID DISCOVERY MODE — ACTIVE        │");
    Serial.println("│  Scan your cards to see their UIDs. │");
    Serial.println("│  No attendance will be sent.        │");
    Serial.println("└─────────────────────────────────────┘");
    Serial.println();
    Serial.println(">>> Ready — scan a card now...");
    return;
  }

  // Connect to WiFi
  Serial.print("Connecting to WiFi: " + String(WIFI_SSID));
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.println("IP Address: " + WiFi.localIP().toString());
    beep(1, 200);
    digitalWrite(LED_GREEN, HIGH);
  } else {
    Serial.println("\nWiFi FAILED. Running offline.");
    beep(3, 100);
    digitalWrite(LED_RED, HIGH);
  }

  Serial.println(">>> Ready to scan RFID cards...");
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    return;
  }

  // Debounce
  if (millis() - lastCardTime < DEBOUNCE_MS) {
    rfid.PICC_HaltA();
    return;
  }
  lastCardTime = millis();

  // Read UID
  String rfidTag = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10)
      rfidTag += "0";
    rfidTag += String(rfid.uid.uidByte[i], HEX);
  }
  rfidTag.toUpperCase();

  Serial.println("──────────────────────────────────────");

  // ── DISCOVERY MODE: just print UID, don't send ──────────
  if (UID_DISCOVERY_MODE) {
    Serial.println(">>> CARD UID: " + rfidTag);
    Serial.println("    Copy this UID and register it in the admin panel.");
    Serial.println("──────────────────────────────────────");
    beep(1, 100);
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    return;
  }

  // ── NORMAL MODE: send to server ─────────────────────────
  Serial.println("Card scanned: " + rfidTag);

  if (WiFi.status() == WL_CONNECTED) {
    bool success = markAttendance(rfidTag);
    if (success) {
      beep(2, 150);
      digitalWrite(LED_GREEN, HIGH);
      digitalWrite(LED_RED, LOW);
      delay(1000);
      digitalWrite(LED_GREEN, LOW);
    } else {
      beep(1, 500);
      digitalWrite(LED_RED, HIGH);
      digitalWrite(LED_GREEN, LOW);
      delay(1000);
      digitalWrite(LED_RED, LOW);
    }
  } else {
    Serial.println("No WiFi — cannot send attendance.");
    beep(3, 100);
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

bool markAttendance(String rfidTag) {
  WiFiClient client;

  HTTPClient http;
  http.setTimeout(10000);  // 10 second timeout
  
  Serial.println("Connecting to: " + String(SERVER_URL));
  
  if (!http.begin(client, SERVER_URL)) {
    Serial.println("ERROR: http.begin() failed — check URL");
    return false;
  }
  
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["rfid_tag"] = rfidTag;
  doc["device_id"] = DEVICE_ID;
  doc["secret_key"] = SECRET_KEY;

  String payload;
  serializeJson(doc, payload);

  Serial.println("Sending: " + payload);

  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("HTTP " + String(httpCode) + ": " + response);

    StaticJsonDocument<512> resp;
    if (!deserializeJson(resp, response)) {
      bool success = resp["success"].as<bool>();
      const char *message = resp["message"] | "No message";
      Serial.println("Server: " + String(message));
      http.end();
      return success;
    }
  } else {
    Serial.println("HTTP Error: " + http.errorToString(httpCode));
    Serial.println("WiFi status: " + String(WiFi.status()));
    Serial.println("WiFi RSSI: " + String(WiFi.RSSI()) + " dBm");
  }

  http.end();
  return false;
}

void beep(int times, int duration) {
  for (int i = 0; i < times; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(duration);
    digitalWrite(BUZZER_PIN, LOW);
    if (i < times - 1)
      delay(100);
  }
}
