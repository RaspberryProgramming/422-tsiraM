import { System, CLOCK_INTERVAL } from "../System";
import { Hardware } from "./Hardware";
import { Cpu } from "./Cpu";
import { Memory } from "./Memory";

export class Clock extends Hardware {
  constructor(id) {
    super(id, "CLK");
  }

  public ClockListener = []; // Array of clock listeners
  public runningClock = null; // Array of running clocks
  // Each clock listener has an interface

  public addListener(listener) {
    if (listener.pulse) {
      // If the listener is a proper class
      this.ClockListener[Object.keys(this.ClockListener).length] = listener; // The listener is added to the ClockListener array

      this.log("Added Clock Listener " + listener.name);
    } else {
      this.log("[ ! ] Invalid Clock Listener " + listener.name); // Error is displayed that the listener is not valid
    }
  }

  public sendPulse(ClockListener) {
    var length = Object.keys(ClockListener).length; // Gets the size of ClockListener Array

    for (var k = 0; k < length; k++) {
      //  Iterates through each item and runs their pulse methods
      ClockListener[k].pulse();
    }
  }

  public startClock() {
    // Start the clock, create set interval process
    this.runningClock = setInterval(this.sendPulse, CLOCK_INTERVAL, this.ClockListener); // Starts the clock using sendPulse function
  }

  public stopClock() {
    // Kill the interval process
    if (this.runningClock != null) {
      clearInterval(this.runningClock);
    }
  }
}
