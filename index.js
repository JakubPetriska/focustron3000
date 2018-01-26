const SECONDS_PER_HOUR = 60 * 60;
const SECONDS_PER_MINUTE = 60;

let params = (new URL(document.location)).searchParams;
let to = params.get("to");

let data = null;
if (to) {
  data = {
    to: moment(to),
    secondsLeft: -1,
    countdownUpdateIntervalId: -1,
  };
} else {
  data = {
    menuDatepicker: null,
    menuTimepicker: null,
    date: moment().format('YYYY-MM-DD'),
    time: moment().format('HH:mm'),
  };
}

const vm = new Vue({
  el: "#app",
  data,
  created: function () {
    if (this.to) {
      this.updateSecondsLeft();
      this.countdownUpdateIntervalId = setInterval(
        () => {
          this.updateSecondsLeft();
          document.title = this.timeLeftString;
          if (this.secondsLeft <= 0) {
            clearInterval(this.countdownUpdateIntervalId);
            document.title = 'Finished!';
          }
        },
        1000
      );
    }
  },
  methods: {
    startCountdown: function () {
      const pickedDatetime = moment(this.date + ' ' + this.time);
      const countdownTimeParam = 'to=' + pickedDatetime.toISOString();
      const url = window.location.origin + window.location.pathname + '?' + countdownTimeParam;
      window.location.href = url;
    },
    updateSecondsLeft: function () {
      this.secondsLeft = this.to.unix() - moment().unix();
    }
  },
  computed: {
    timeLeftString: function () {
      let currentSecondsLeft = this.secondsLeft;
      const hoursLeft = Math.floor(currentSecondsLeft / SECONDS_PER_HOUR);
      currentSecondsLeft -= hoursLeft * SECONDS_PER_HOUR;

      const minutesLeft = Math.floor(currentSecondsLeft / SECONDS_PER_MINUTE);
      currentSecondsLeft -= minutesLeft * SECONDS_PER_MINUTE;

      return hoursLeft + ':' + minutesLeft + ':' + currentSecondsLeft;
    }
  }
});
