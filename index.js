const FAVICON_SIZE = 48;
const FAVICON_BORDER_SIZE = 3;

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * 60;
const SECONDS_PER_DAY = SECONDS_PER_HOUR * 24;

const QUOTES_LINK = 'https://gist.githubusercontent.com/JakubPetriska/060958fd744ca34f099e947cd080b540/raw/b67adf9f1978df0288486ca076023798fea11e3d/quotes.csv';
const QUOTE_REFRESH_INTERVAL_SECONDS = 5 * 60;

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
const r = params.get("r");

Vue.component('home', {
  template: '#home',
  data: () => ({
    menuDatepicker: null,
    menuTimepicker: null,


    date: moment().add(2, 'h').format('YYYY-MM-DD'),
    time: moment().add(2, 'h').format('HH:mm'),
    faviconLink: null,
  }),
  created: function () {
    const link = document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = 'favicon.png';
    document.getElementsByTagName('head')[0].appendChild(link);
    this.faviconLink = link;
  },
  destroyed: function () {
    this.faviconLink.remove();
  },
  computed: {
    timerLink: function () {
      const pickedDatetime = moment(this.date + ' ' + this.time);
      const params = [
        'r=' + Math.round(Math.random() * 5000 + 1),
        'from=' + moment().toISOString(),
        'to=' + pickedDatetime.toISOString(),
      ].join('&');
      return window.location.origin + window.location.pathname + '?' + params;
    }
  },
});

Vue.component('countdown', {
  template: '#countdown',
  data: () => ({
    to: moment(to),
    from: moment(from),
    randomModifier: r,
    secondsLeftTotal: -1,
    secondsLeft: -1,
    countdownUpdateIntervalId: -1,
    faviconLink: null,
    lastFaviconStep: -1,
    quotes: null,
    currentQuote: null,
  }),
  created: function () {
    this.updateSecondsLeft();
    this.secondsLeftTotal =this.to.unix() - this.from.unix();
    this.updateTitle();
    this.updateFavicon();
    this.countdownUpdateIntervalId = setInterval(
      () => {
        this.updateSecondsLeft();
        this.updateTitle();
        this.updateFavicon();
        if (this.secondsLeft <= 0) {
          clearInterval(this.countdownUpdateIntervalId);
          document.title = 'Finished!';
        }
      },
      1000
    );

    const quotesDownloadCompleteFunc = (results) => {
      if (results.errors.length == 0) {
        this.quotes = results.data.slice(1); // Remove header row
        this.updateQuote();
      }
    };
    Papa.parse(QUOTES_LINK, {
      download: true,
      complete: quotesDownloadCompleteFunc
    });
  },
  methods: {
    updateSecondsLeft: function () {
      this.secondsLeft = Math.max(this.to.unix() - moment().unix(), 0);
    },
    updateTitle: function () {
      document.title = this.timeLeftTitleString;
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
    },
    updateQuote: function() {
      const quoteShowtime =
        Math.floor(moment().unix() / QUOTE_REFRESH_INTERVAL_SECONDS) * QUOTE_REFRESH_INTERVAL_SECONDS;
      const nextQuoteShowtime = quoteShowtime + QUOTE_REFRESH_INTERVAL_SECONDS;

      const quoteIndex = Math.round(quoteShowtime * this.randomModifier) % this.quotes.length;
      this.currentQuote = this.quotes[quoteIndex];

      setTimeout(() => this.updateQuote(), (nextQuoteShowtime - moment().unix() + 1) * 1000);
    },
    goBack: function () {
      const url = window.location.origin + window.location.pathname;
      window.location.href = url;
    }
  },
  computed: {
    timeLeft: function () {
      let currentSecondsLeft = this.secondsLeft;
      const daysLeft = Math.floor(currentSecondsLeft / SECONDS_PER_DAY);
      currentSecondsLeft -= daysLeft * SECONDS_PER_DAY;

      const hoursLeft = Math.floor(currentSecondsLeft / SECONDS_PER_HOUR);
      currentSecondsLeft -= hoursLeft * SECONDS_PER_HOUR;

      const minutesLeft = Math.floor(currentSecondsLeft / SECONDS_PER_MINUTE);
      currentSecondsLeft -= minutesLeft * SECONDS_PER_MINUTE;
      return [daysLeft, hoursLeft, minutesLeft, currentSecondsLeft];
    },
    timeLeftString: function () {
      return this.timeLeft
        .map(formatNumberToTwoDigits)
        .join(':');
    },
    timeLeftTitleString: function () {
      let values = this.timeLeft;
      while(values[0] === 0) {
        values = values.slice(1);
      }
      let daysString = '';
      if (values.length == 4) {
        daysString = values[0] + ' days ';
        values = values.slice(1);
      }
      return daysString + values
        .map((e, i) => i > 0 ? formatNumberToTwoDigits(e) : (e + ''))
        .join(':');
    },
    countdownPageHeader: function () {
      if (this.secondsLeft > 0) {
        return this.timeLeftTitleString;
      } else {
        return 'It\'s finished';
      }
    },
  }
});

const vm = new Vue({
  el: "#app",
  data: {
    to
  }
});
