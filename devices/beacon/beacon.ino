/* SHine-K 3.0 · USB 警示灯（Arduino Uno / Nano）
 * 现场端（live.html）点“＋ USB 警示灯”后，通过 Web Serial 发送一个字母：
 *   R = 危险：红灯闪 + 蜂鸣器    Y = 警告：黄灯常亮    0 = 全部关闭    T = 自检（三个灯各闪一下）
 * 接线：D8 → 红色 LED/继电器，D9 → 黄色 LED/继电器，D10 → 绿色 LED，D11 → 有源蜂鸣器（LED 记得串 220Ω 电阻）
 * 波特率 9600。待机时绿灯常亮。
 */
const int RED = 8, YEL = 9, GRN = 10, BUZ = 11;
char mode = '0';
unsigned long lastRx = 0;

void setup() {
  pinMode(RED, OUTPUT); pinMode(YEL, OUTPUT); pinMode(GRN, OUTPUT); pinMode(BUZ, OUTPUT);
  Serial.begin(9600);
  digitalWrite(GRN, HIGH);
  lastRx = millis();
}

void selfTest() {
  int pins[] = {RED, YEL, GRN};
  for (int i = 0; i < 3; i++) { digitalWrite(pins[i], HIGH); delay(250); digitalWrite(pins[i], LOW); }
  digitalWrite(BUZ, HIGH); delay(120); digitalWrite(BUZ, LOW);
}

void loop() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == 'R' || c == 'Y' || c == '0') { mode = c; lastRx = millis(); }
    else if (c == 'T') { selfTest(); lastRx = millis(); }
  }
  unsigned long now = millis();
  bool blink = (now / 250) % 2;
  if (mode == 'R') {
    digitalWrite(RED, blink); digitalWrite(BUZ, blink); digitalWrite(YEL, LOW); digitalWrite(GRN, LOW);
  } else if (mode == 'Y') {
    digitalWrite(RED, LOW); digitalWrite(BUZ, LOW); digitalWrite(YEL, HIGH); digitalWrite(GRN, LOW);
  } else {
    digitalWrite(RED, LOW); digitalWrite(BUZ, LOW); digitalWrite(YEL, LOW); digitalWrite(GRN, HIGH);
  }
}
