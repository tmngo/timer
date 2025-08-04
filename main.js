const secondsSpan = document.getElementsByClassName("number-s")[0];
const toggleButton = document.getElementById("button-toggle");
const resetButton = document.getElementById("button-reset");

const playUnicode = "▶";
const pauseUnicode = "⏸";
const resetUnicode = "↺";

const parseMilliseconds = (ms) => [
  Math.floor((ms + 999) / 3_600_000),
  Math.floor((ms + 999) / 60_000) % 60,
  Math.floor((ms + 999) / 1000) % 60,
];

let timerIndex = 0;
let timers = [];
let isTotal = 0;

const startTimer = (durationSeconds, display, icon, onComplete, msInitial) => {
  let startTime, timer, obj;
  let msLeft = 0;
  let total = 0;
  let previousTotal = 0;
  let isPaused = false;
  let isCompleted = false;

  // let display = document.getElementById(containerId);
  obj = {};
  obj.isCompleted = () => isCompleted;
  obj.total = () => total;
  obj.msLeft = () => msLeft;
  obj.reset = (msInitial) => {
    clearInterval(timer);
    isPaused = true;
    isCompleted = false;
    msLeft = msInitial ?? durationSeconds * 1000;
    let [h, m, s] = parseMilliseconds(msLeft);
    display[0].innerHTML = h;
    if (h === 0) {
      display[0].style.display = "none";
      display[1].style.display = "none";
    }
    display[2].innerHTML = h !== 0 && m < 10 ? "0" + m : m;
    if (m === 0) {
      display[2].style.display = "none";
      display[3].style.display = "none";
    }
    display[4].innerHTML = m !== 0 && s < 10 ? "0" + s : s;
    icon.innerHTML = playUnicode;
    icon.style["padding-bottom"] = "0em";
  };
  obj.resume = () => {
    console.log("resume", msLeft);
    if (isCompleted) {
      obj.reset();
      return;
    }
    // for (let i = 0; i < timers.length; i++) {
    //   if (timers[i].isCompleted()) timers[i].reset();
    // }
    startTime = new Date().getTime();
    previousTotal = total;
    timer = setInterval(obj.step, 125); // adjust this number to affect granularity
    isPaused = false;
    // lower numbers are more accurate, but more CPU-expensive
    icon.innerHTML = pauseUnicode;
    icon.style["padding-bottom"] = "1.5em";
  };
  obj.pause = () => {
    console.log("pause", msLeft);
    msLeft = obj.step();
    console.log("pause", msLeft);
    clearInterval(timer);
    isPaused = true;
    icon.innerHTML = playUnicode;
    icon.style["padding-bottom"] = "0em";
  };
  obj.step = () => {
    let delta = new Date().getTime() - startTime;

    total = Math.min(delta, msLeft) + previousTotal;
    let now = Math.max(0, msLeft - delta);
    let [h, m, s] = parseMilliseconds(now);

    display[0].innerHTML = h;
    display[2].innerHTML = h !== 0 && m < 10 ? "0" + m : m;
    display[4].innerHTML = m !== 0 && s < 10 ? "0" + s : s;
    icon.setAttribute("title", total);

    // on timer timeout
    if (now === 0) {
      clearInterval(timer);
      isPaused = true;
      isCompleted = true;
      icon.innerHTML = playUnicode;
      icon.style["padding-bottom"] = "0em";
      // obj.resume = function () {};
      if (onComplete) onComplete();
      icon.innerHTML = resetUnicode;
      icon.style["padding-bottom"] = "1.5em";
    }
    return now;
  };

  icon.onclick = () => {
    if (!isPaused) {
      obj.pause();
    } else {
      obj.resume();
    }
  };

  obj.reset(msInitial);

  return obj;
};

const msInitial = JSON.parse(localStorage.getItem("msLeft"));
// const msInitial = [];

timers.push(
  startTimer(
    3,
    document.getElementById("time-input-1").children,
    document.getElementsByClassName("row-icon")[0],
    () => {},
    msInitial?.[0]
  ),
  startTimer(
    1000,
    document.getElementById("time-input-2").children,
    document.getElementsByClassName("row-icon")[2],
    () => {},
    msInitial?.[1]
  )
);

console.log(msInitial?.[0]);
console.log(timers[0].msLeft());

const setActiveTimer = (index) => {
  timers[timerIndex].pause();
  timers[timerIndex].reset();
  timerIndex = index;
};

// resetButton.onclick = () => {
//   timers[timerIndex].pause();
//   timer[timerIndex].reset();
// };

addEventListener("keydown", (event) => {
  console.log(event);
  if (event.code === "Tab") {
  }
});

addEventListener("beforeunload", (event) => {
  localStorage.setItem(
    "msLeft",
    JSON.stringify([timers[0].msLeft(), timers[1].msLeft()])
  );
  localStorage.setItem(
    "totals",
    JSON.stringify([timers[0].total(), timers[1].total()])
  );
  // event.preventDefault();
});
