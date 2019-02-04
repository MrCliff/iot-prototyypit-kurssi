#include <wiringPi.h>
#include <time.h>

static const int PIN_PIR = 5;
static const int PIN_LED = 6;

int main(void) {
    struct timespec sleeptime = {0, 1000000L}; // 0s 1ms

    wiringPiSetupGpio();
    pinMode(PIN_PIR, INPUT);
    pinMode(PIN_LED, OUTPUT);

    while(1) {
        digitalWrite(PIN_LED, digitalRead(PIN_PIR));

        nanosleep(&sleeptime, NULL);
    }

    return 0;
}
