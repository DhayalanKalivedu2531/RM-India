import { LightningElement, track } from 'lwc';

export default class Stopwatch extends LightningElement {

    @track hours;
    @track minutes;
    @track seconds;
    @track time;
    @track showMorning = false;
    @track showNoon = false;
    @track showEvening = false;

    connectedCallback() {
        this.showtime();
    }

    timeoutFunction() {
        setTimeout(() => {
            this.showtime();
        }, 1000);
    }

    showtime() {
        let date = new Date();
        let session = "AM";
        this.hours = date.getHours();
        this.minutes = date.getMinutes();
        this.seconds = date.getSeconds();

        if (this.hours >= 12) {
            session = "PM";
        }

        if (this.hours >= 17 && this.hours <= 23) {
            this.showMorning = false;
            this.showNoon = false;
            this.showEvening = true;
        } else if (this.hours >= 12 && this.hours < 17) {
            this.showMorning = false;
            this.showNoon = true;
            this.showEvening = false;
        } else {
            this.showMorning = true;
            this.showNoon = false;
            this.showEvening = false;
        }

        this.hours = (this.hours % 12) || 12; 
        this.hours = (this.hours < 10) ? "0" + this.hours : this.hours;
        this.minutes = (this.minutes < 10) ? "0" + this.minutes : this.minutes;
        this.seconds = (this.seconds < 10) ? "0" + this.seconds : this.seconds;
        this.time = `${this.hours}:${this.minutes}:${this.seconds} ${session}`;

        this.timeoutFunction();
    }
}