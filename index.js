const FAVICON_SIZE = 48;
const FAVICON_BORDER_SIZE = 3;

const SECONDS_PER_HOUR = 60 * 60;
const SECONDS_PER_MINUTE = 60;

const formatNumberToTwoDigits = (number) => {
  const str = number + '';
  if (str.length == 1) {
    return '0' + str;
  } else {
    return str;
  }
};

const params = (new URL(document.location)).searchParams;
const to = params.get("to");
const from = params.get("from");

let data = null;
if (to) {
  data = {
    to: moment(to),
    from: moment(from),
    secondsLeftTotal: -1,
    secondsLeft: -1,
    countdownUpdateIntervalId: -1,
    faviconLink: null,
    lastFaviconStep: -1
  };
} else {
  data = {
    menuDatepicker: null,
    menuTimepicker: null,
    date: moment().add(2, 'h').format('YYYY-MM-DD'),
    time: moment().add(2, 'h').format('HH:mm'),
  };
}

const vm = new Vue({
  el: "#app",
  data,
  created: function () {
    if (this.to) {
      this.updateSecondsLeft();
      this.secondsLeftTotal =this.to.unix() - this.from.unix();
      this.updateFavicon();
      this.countdownUpdateIntervalId = setInterval(
        () => {
          this.updateSecondsLeft();
          this.updateFavicon();
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
      const params = [
        'from=' + moment().toISOString(),
        'to=' + pickedDatetime.toISOString()
      ].join('&');
      const url = window.location.origin + window.location.pathname + '?' + params;
      window.location.href = url;
    },
    updateSecondsLeft: function () {
      this.secondsLeft = Math.max(this.to.unix() - moment().unix(), 0);
    },
    updateFavicon: function () {
      const progressPercentage =
        Math.min(Math.max((this.secondsLeftTotal - this.secondsLeft) / this.secondsLeftTotal, 0), 1);
      const faviconStep = Math.round(progressPercentage * 50);
      if (this.lastFaviconStep == faviconStep) {
        return;
      }
      this.lastFaviconStep = faviconStep;

      if (this.faviconLink) {
        this.faviconLink.remove();
      }

      const canvas = document.createElement('canvas');
      canvas.width = FAVICON_SIZE;
      canvas.height = FAVICON_SIZE;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = 'rgb(90, 90, 90)';
      ctx.fillRect(0, 0, FAVICON_SIZE, FAVICON_SIZE);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, FAVICON_SIZE, FAVICON_BORDER_SIZE);
      ctx.fillRect(0, 0, FAVICON_BORDER_SIZE, FAVICON_SIZE);
      ctx.fillRect(FAVICON_SIZE - FAVICON_BORDER_SIZE, 0, FAVICON_BORDER_SIZE, FAVICON_SIZE);
      ctx.fillRect(0, FAVICON_SIZE - FAVICON_BORDER_SIZE, FAVICON_SIZE, FAVICON_BORDER_SIZE);

      const greenValue = Math.min(Math.round(255 * (1 - progressPercentage) * 2), 255);
      const redValue = Math.min(Math.round(255 * progressPercentage * 2), 255);
      ctx.fillStyle = `rgb(${redValue}, ${greenValue}, 0)`;
      ctx.fillRect(
        FAVICON_BORDER_SIZE,
        FAVICON_BORDER_SIZE,
        Math.round((FAVICON_SIZE - FAVICON_BORDER_SIZE * 2) * progressPercentage),
        FAVICON_SIZE - FAVICON_BORDER_SIZE * 2
      );

      const link = document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = canvas.toDataURL("image/x-icon");
      document.getElementsByTagName('head')[0].appendChild(link);
      this.faviconLink = link;
    }
  },
  computed: {
    timeLeftString: function () {
      let currentSecondsLeft = this.secondsLeft;
      const hoursLeft = Math.floor(currentSecondsLeft / SECONDS_PER_HOUR);
      currentSecondsLeft -= hoursLeft * SECONDS_PER_HOUR;

      const minutesLeft = Math.floor(currentSecondsLeft / SECONDS_PER_MINUTE);
      currentSecondsLeft -= minutesLeft * SECONDS_PER_MINUTE;

      return [hoursLeft, minutesLeft, currentSecondsLeft]
        .map(formatNumberToTwoDigits)
        .join(':');
    }
  }
});
