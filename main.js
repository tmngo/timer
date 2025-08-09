const secondsSpan = document.getElementsByClassName("number-s")[0];
const toggleButton = document.getElementById("button-toggle");
const resetButton = document.getElementById("button-reset");

const playUnicode = "▶";
const pauseUnicode = "⏸";
const resetUnicode = "⟲"; // ⟲ ↺
const stopUnicode = "⏹";

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

const parseMilliseconds = (ms) => {
    const totalSeconds = Math.floor((ms + 999) / 1000);

    const hours =
        ms >= 0
            ? Math.floor(
                  (ms + 999) / (1000 * SECONDS_PER_MINUTE * MINUTES_PER_HOUR)
              )
            : Math.trunc(
                  totalSeconds / (SECONDS_PER_MINUTE * MINUTES_PER_HOUR)
              );

    const minutes =
        ms >= 0
            ? Math.floor((ms + 999) / (1000 * SECONDS_PER_MINUTE)) %
              MINUTES_PER_HOUR
            : Math.trunc(totalSeconds / SECONDS_PER_MINUTE) % MINUTES_PER_HOUR;

    const seconds = totalSeconds % SECONDS_PER_MINUTE;

    return [hours, minutes, seconds];
};

const renderTime = (hValue, hUnit, mValue, mUnit, sValue, ms) => {
    const [h, m, s] = parseMilliseconds(ms);
    if (h !== 0) {
        hValue.style.display = "inline";
        hUnit.style.display = "inline";
        mValue.style.display = "inline";
        mUnit.style.display = "inline";

        hValue.innerHTML = h;
        mValue.innerHTML = Math.abs(m).toString().padStart(2, "0");
        sValue.innerHTML = Math.abs(s).toString().padStart(2, "0");
    } else if (m !== 0) {
        hValue.style.display = "none";
        hUnit.style.display = "none";
        mValue.style.display = "inline";
        mUnit.style.display = "inline";

        mValue.innerHTML = m;
        sValue.innerHTML = Math.abs(s).toString().padStart(2, "0");
    } else {
        hValue.style.display = "none";
        hUnit.style.display = "none";
        mValue.style.display = "none";
        mUnit.style.display = "none";

        sValue.innerHTML = s;
    }
};

const startBlinkingTitle = (message) => {
    if (!document.hidden) return;

    const originalTitle = document.title;
    let showingMessage = false;

    const blinkInterval = setInterval(() => {
        const completeCount = timers.reduce(
            (count, t) => (t.isCompleted() ? count + 1 : count),
            0
        );
        document.title = showingMessage
            ? originalTitle
            : message + `(${completeCount})`;
        showingMessage = !showingMessage;
    }, 1000); // change every 1 second

    // Optional: stop blinking when the tab becomes active again
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            clearInterval(blinkInterval);
            document.title = originalTitle;
        }
    });
};

Notification.requestPermission().then((result) => {});

let timers = [];

const addButton = document.getElementById("add");

const addTimer = (
    container,
    id,
    seconds,
    msInitial = undefined,
    savedTotal = 0
) => {
    const template = document.createElement("template");
    const [h, m, s] = parseMilliseconds(seconds * 1000);
    const [h0, m0, s0] = parseMilliseconds(savedTotal);
    template.innerHTML = `
    <div class="row-icon play">▶</div>
    <div class="reset-container">
        <div class="row-icon reset">${resetUnicode}</div>
    </div>
    <!-- <div class="row-number">1</div> -->
    <div class="time-input" tabindex="${id}">
        <span class="time-number number-h">${h}</span>
        <span class="time-unit unit-h">h</span>
        <span class="time-number number-m">${m}</span>
        <span class="time-unit unit-m">m</span>
        <span class="time-number number-s">${s}</span>
        <span class="time-unit unit-s">s</span>
    </div>
    <div class="time-total">
        <span class="time-number number-h2">${h0}</span>
        <span class="time-unit unit-h">h</span>
        <span class="time-number number-m2">${m0}</span>
        <span class="time-unit unit-m">m</span>
        <span class="time-number number-s2">${s0}</span>
        <span class="time-unit unit-s">s</span>
    </div>
    <div class="clear-container">
        <div class="row-icon clear">${resetUnicode}</div>
    </div>
    <div class="row-icon delete">✖</div>
    <div class="spacer"/>
  `;
    const playButton = template.content.querySelector(".play");
    const resetButton = template.content.querySelector(".reset");
    const clearButton = template.content.querySelector(".clear");
    const deleteButton = template.content.querySelector(".delete");

    const timeInput = template.content.querySelector(".time-input");
    const maxLength = 6;

    const hElement = template.content.querySelector(".number-h");
    const hUnit = template.content.querySelector(".unit-h");
    const mElement = template.content.querySelector(".number-m");
    const mUnit = template.content.querySelector(".unit-m");
    const sElement = template.content.querySelector(".number-s");

    const htElement = template.content.querySelector(".number-h2");
    const htUnit = template.content.querySelector(".time-total .unit-h");
    const mtElement = template.content.querySelector(".number-m2");
    const mtUnit = template.content.querySelector(".time-total .unit-m");
    const stElement = template.content.querySelector(".number-s2");

    let durationSeconds = seconds;

    let startTime, timer;
    let msLeft = 0;
    let total = savedTotal;
    let previousTotal = 0;
    let isPaused = false;
    let isCompleted = false;

    renderTime(htElement, htUnit, mtElement, mtUnit, stElement, total - 999);

    const obj = {
        id: () => id,
        duration: () => durationSeconds,
        isCompleted: () => isCompleted,
        total: () => total,
        msLeft: () => msLeft,
        reset: (msInitial) => {
            clearInterval(timer);
            isPaused = true;
            isCompleted = false;
            msLeft = msInitial ?? durationSeconds * 1000;

            renderTime(hElement, hUnit, mElement, mUnit, sElement, msLeft);

            // round
            total = Math.floor(total / 1000) * 1000;

            playButton.innerHTML = playUnicode;
            playButton.style["padding-bottom"] = "0em";
            playButton.style.color = "inherit";
            timeInput.style.color = "inherit";
            resetButton.style.display =
                msLeft === durationSeconds * 1000 ? "none" : "block";
        },
        resume: () => {
            startTime = new Date().getTime();
            previousTotal = total;
            // adjust this number to affect granularity
            // lower numbers are more accurate, but more CPU-expensive
            timer = setInterval(obj.step, 125);
            isPaused = false;

            playButton.innerHTML = pauseUnicode;
            playButton.style["padding-bottom"] = "1.5em";
            resetButton.style.display = "block";
            clearButton.style.display = "block";
        },
        pause: () => {
            clearInterval(timer);
            isPaused = true;

            total = Math.floor(total / 1000) * 1000;
            const delta = new Date().getTime() - startTime;
            msLeft -= delta;

            playButton.innerHTML = playUnicode;
            playButton.style["padding-bottom"] = "0em";
        },
        step: () => {
            // time since resume
            const delta = new Date().getTime() - startTime;

            total = delta + previousTotal;
            const now = msLeft - delta;

            renderTime(hElement, hUnit, mElement, mUnit, sElement, now);
            renderTime(
                htElement,
                htUnit,
                mtElement,
                mtUnit,
                stElement,
                total - 999
            );

            playButton.setAttribute("title", total);

            // on timer timeout
            if (now < 0) {
                //   clearInterval(timer);
                //   isPaused = true;
                if (!isCompleted) {
                    // timeInput.style.backgroundColor = "#000";
                    timeInput.style.color = "#a03";
                    playButton.style.color = "#a03";
                    resetButton.style.display = "none";
                    if (durationSeconds > 0) {
                        const [h, m, s] = parseMilliseconds(
                            durationSeconds * 1000
                        );
                        let timerName = "";
                        if (h > 0) {
                            timerName += h + "h";
                        }
                        if (m > 0) {
                            timerName += m + "m";
                        }
                        if (s > 0) {
                            timerName += s;
                            if (h === 0 && m == 0) timerName += "s";
                        }
                        new Notification(`${timerName} timer complete.`, {
                            // body: ,
                        });
                        startBlinkingTitle("timer ");
                    }
                }
                isCompleted = true;
                //   icon.innerHTML = playUnicode;
                //   icon.style["padding-bottom"] = "0em";
                //   // obj.resume = function () {};
                //   // if (onComplete) onComplete();
                playButton.innerHTML = stopUnicode;
                //   icon.style["padding-bottom"] = "1.5em";
            }
            return now;
        },
    };

    playButton.onclick = () => {
        if (isCompleted) {
            obj.reset();
            return;
        }
        if (isPaused) {
            obj.resume();
        } else {
            obj.pause();
        }
    };

    let timeInputValue = "";
    let isChanged = false;
    timeInput.onfocus = () => {
        if (isCompleted) {
            obj.reset();
        } else {
            obj.pause();
        }
        timeInput.style.borderBottom = "solid 1px black";
        timeInput.style.marginBottom = "-1px";
        timeInputValue = "";
        const [h, m, s] = parseMilliseconds(durationSeconds * 1000);
        if (h > 0) {
            timeInputValue =
                h.toString() +
                m.toString().padStart(2, "0") +
                s.toString().padStart(2, "0");
        } else if (m > 0) {
            timeInputValue = m.toString() + s.toString().padStart(2, "0");
        } else if (s > 0) {
            timeInputValue = s.toString();
        }
    };

    timeInput.onblur = () => {
        timeInput.style.border = "none";
        if (isChanged) {
            isChanged = false;
            const sInput = timeInputValue.substring(
                timeInputValue.length - 2,
                timeInputValue.length
            );
            const mInput = timeInputValue.substring(
                timeInputValue.length - 4,
                timeInputValue.length - 2
            );
            const hInput = timeInputValue.substring(
                timeInputValue.length - 6,
                timeInputValue.length - 4
            );
            durationSeconds =
                (sInput === "" ? 0 : parseInt(sInput)) +
                (mInput === "" ? 0 : parseInt(mInput) * 60) +
                (hInput === "" ? 0 : parseInt(hInput) * 3600);
            durationSeconds = Math.min(
                durationSeconds,
                99 * 3600 + 59 * 60 + 59
            );

            obj.reset();
        }
    };

    timeInput.onkeydown = (e) => {
        if (e.key === "Enter") {
            timeInput.blur();
        }
        if (e.key === "Backspace") {
            if (timeInputValue.length > 0) {
                timeInputValue = timeInputValue.substring(
                    0,
                    timeInputValue.length - 1
                );
                isChanged = true;
            }
            sElement.innerHTML = timeInputValue.substring(
                timeInputValue.length - 2,
                timeInputValue.length
            );
            mElement.innerHTML = timeInputValue.substring(
                timeInputValue.length - 4,
                timeInputValue.length - 2
            );
            hElement.innerHTML = timeInputValue.substring(
                timeInputValue.length - 6,
                timeInputValue.length - 4
            );
            if (timeInputValue.length <= 4) {
                hElement.style.display = "none";
                hUnit.style.display = "none";
            }
            if (timeInputValue.length <= 2) {
                mElement.style.display = "none";
                mUnit.style.display = "none";
            }
            return;
        }
        if (/^[0-9]$/.test(e.key)) {
            if (timeInputValue.length < maxLength) {
                timeInputValue += e.key;
                isChanged = true;

                sElement.innerHTML = timeInputValue.substring(
                    timeInputValue.length - 2,
                    timeInputValue.length
                );
                if (timeInputValue.length > 2) {
                    mElement.innerHTML = timeInputValue.substring(
                        timeInputValue.length - 4,
                        timeInputValue.length - 2
                    );
                    mElement.style.display = "inline";
                    mUnit.style.display = "inline";
                }
                if (timeInputValue.length > 4) {
                    hElement.innerHTML = timeInputValue.substring(
                        timeInputValue.length - 6,
                        timeInputValue.length - 4
                    );
                    hElement.style.display = "inline";
                    hUnit.style.display = "inline";
                }
            }
            return;
        }
    };

    resetButton.onclick = () => {
        obj.reset();
    };

    clearButton.onclick = () => {
        total = 0;
        previousTotal = startTime - new Date().getTime();
        renderTime(
            htElement,
            htUnit,
            mtElement,
            mtUnit,
            stElement,
            total - 999
        );
        if (isPaused) {
            clearButton.style.display = "none";
        }
    };
    const elementCount = 7;
    deleteButton.onclick = () => {
        let index = timers.findIndex((t) => t.id() === id);
        for (let i = elementCount - 1; i >= 0; i -= 1) {
            container.children[elementCount * index + i].remove();
        }
        timers.splice(index, 1);
    };

    obj.reset(msInitial);

    container.insertBefore(template.content, addButton);

    return obj;
};

const gridElement = document.getElementById("grid");

const savedTimers = JSON.parse(localStorage.getItem("savedTimers"));

let nextTimerID = 0;

if (savedTimers && savedTimers.length > 0) {
    savedTimers.forEach((t) => {
        timers.push(addTimer(gridElement, nextTimerID++, t[0], t[1], t[2]));
    });
} else {
    timers.push(addTimer(gridElement, nextTimerID++, 20 * 60));
    timers.push(addTimer(gridElement, nextTimerID++, 5 * 60));
}

addButton.onclick = () => {
    timers.push(addTimer(gridElement, nextTimerID++, 0));
};

addEventListener("beforeunload", () => {
    localStorage.setItem(
        "savedTimers",
        JSON.stringify(timers.map((t) => [t.duration(), t.msLeft(), t.total()]))
    );
    // event.preventDefault();
});
