import { System } from "../System";
import { Ascii } from "./ascii";
import { Hardware } from "./Hardware";
import { ClockListener } from "./imp/ClockListener";

export class Cpu extends Hardware implements ClockListener {
  private cpuClockCount = 0;
  private _MMU; // Memory Management Unit
  private _INTCONTROLLER; // Interrupt Controller
  private _SYSTEM; // Holds variable for the system
  private opp; // stores data from a fetch
  private ir = 0x00; // Instruction Register
  private acc = 0x00; // Accumulator
  private xReg = 0x00; // X Register
  private yReg = 0x00; // Y Register
  private zFlag = 0x00; // Z Flag
  private step = 0x00; // Step
  private stepCounter = 0x00; // Step Counter
  private pc = 0x00; // Program Counter
  // Stores Operands for Instruction Register
  private irx = 0x00; // Instruction Register X
  private iry = 0x00 // Instruction Register Y
  private ascii = new Ascii(); // Holds class with functions to convert ascii
  
  constructor(id, MMU, INTCONTROLLER, SYSTEM) {
    super(id, "CPU");

    this._MMU = MMU;
    this._INTCONTROLLER = INTCONTROLLER;
    this._SYSTEM = SYSTEM;
  }

  public pulse() {
    this.cpuClockCount++; // Iterate the clock count
    this.log(
      // Log that the cpu has recieved a clock pulse
      "received clock pulse - CPU Clock Count: " +
        this.cpuClockCount.toString(10)
    );

    // Choose the step and run it's code
    switch(this.step) {
      case 0x00:
        // Fetches instruction and puts into the Instruction Register to print
        this.fetch();
        this.ir = this.opp; // This will be redundant but is necessary for the following log statment
        break;
      case 0x01:
        // Run decode to copy instruction into the Instruction Register
        this.decode();
        break;
      case 0x02:
        // Run Decode again
        this.decode();
        break;
      case 0x03:
        // Executes the instruction
        this.execute();
        break;
      case 0x04:
        // Writes back to memory
        this.writeBack();
        break;
      case 0x05:
        // Checks for interrupts
        this.interruptCheck();
        break;
    }

    this.log(
      // Log State for the Elements of the CPU on each clock cycle
      "CPU State | Mode: N/A PC:" + this.paddstr(this.pc.toString(16), 4) +
      " IR: " + this.paddstr(this.ir.toString(16), 2) +
      " Acc: " + this.paddstr(this.acc.toString(16), 2) +
      " xReg: " + this.paddstr(this.xReg.toString(16), 2) +
      " yReg: " + this.paddstr(this.yReg.toString(16), 2) + 
      " zFlag: " + this.zFlag.toString(16) +
      " Step: " + this.stepCounter.toString(10)
    );

  }

  public unpaddstr(address) {
    /**
     * unpaddstr: removes padding at beggining of string representing hex
     *
     * address: a string passed to the function that represents a padded hex address
     */

    while (address[0] == 0 && address.length > 1) {
      // remove padding until non-zero digit or last digit is found
      address.shift(); // Remove first digit
    }

    return address; // return unpadded address string
  }

  public paddstr(address, addrlength) {
    /**
     * paddstr: adds padding at beggining of string representing hex
     *
     * address: a string passed to the function that represents an unpadded hex address
     * addrlength: the max length of address
     */
    while (address.length < addrlength) {
      // loops until the address length is the same as addrlength
      address = "0" + address; // add a 0 at the beggining of the address
    }

    return address;
  }

  private onesComp(data) {
    var tmpstr = data.toString(2); // Convert data to binary represented as a string
    var outstr = ""; // stores output value

    tmpstr = this.paddstr(tmpstr, 16); // pad tmpstr to have 16 bits

    for (var i = 0; i < tmpstr.length; i++) { // Iterate through tmpstr

      // Flip each bit and store in outstr
      if (tmpstr[i] == '1') {
        outstr += '0';
      } else {
        outstr += '1';
      }
    }

    // Convert outstr to int and return
    return parseInt(outstr, 2);
  }

  private twosComp(data) {
    var tmpdata = this.onesComp(data); // One's Comp

    tmpdata += 1; // Add one for the two's comp

    return tmpdata; // Return the data
  }

  /*******************************
   * Final Project Pipeline
   * Each of these functions takes one cpu cycle.
   *******************************/

  public fetch(){
    /**
     * Fetches a new instruction from memory and inserts it into the IR register.
     */
    this.opp = this._MMU.readImmediate(this.pc++);
    this.step++;
    this.stepCounter++;

  }

  public decode(){
    /**
     * Decodes the instruction in the IR Register into so that the cpu can then execute the instruction
     */
    if (this.step == 1) {
      // Step 1 get Op Code
      this.ir = this.opp;
      this.stepCounter++;
      this.step++;

    } else if (this.step == 2) {
      // Step 2-3 Get Operand
      switch(this.ir) {
        case 0xA9:
          // Load accumulator with constant
          this.fetch();
          break;

        case 0xAD:
          // Load accumulator from memory
          this.fetch();
          break;

        case 0x8D:
          // Store accumulator to memory
          // Fetching memory location
          this.fetch();
          break;

        case 0x6D:
          // Add with Carry
          // Fetch data from memory
          this.fetch();
          break;

        case 0xD0:
          // Branches if zero flag is set. The zero flag is supposed to be set only
          //     when the values being compares are not equal, thus if they are not equal, bne will activate
          this.fetch();
          break;

        case 0xA2:
          // Loads the X register with a constant
          this.fetch();
          break;

        case 0xAE:
          // Loads X register with data in memory
          this.fetch();
          break;

        case 0xA0:
          // Loads the Y register with a constant
          this.fetch();
          break;

        case 0xAC:
          // Loads the Y register with data in memory
          this.fetch();
          break;

        case 0xEE:
          // Increments value in memory
          this.fetch();
          break;

        case 0xEC:
          // Compares byte in memory to x register
          this.fetch();
          break;

        case 0xEA:
          // Does nothing
          this.step++;
          this.stepCounter++;
          break;

        case 0xFF:
          // Syscall to display int/str
          if (this.xReg == 0x02) {
            // Used to get memory location of string
            this.fetch();
          } else {
            // Continues to next step
            this.step++;
            this.stepCounter++;
          }
          break;

        case 0x00:
          // Ends the program in next step
          this.step++;
          this.stepCounter++;
          break;

        default:
          // Unknown instruction, CRASH THE SYSTEM
          this.log("CRASH HALT: UNKNOWN INSTRUCTION");
          this._SYSTEM.stopSystem();

      }
    }
  }

  public execute(){
    /**
     * Executes the given instruction given to the CPU.
     */
    switch(this.ir) {
      case 0xA9:
        // store data in accumulator
        this.acc = this.opp;

        this.step++;
        this.stepCounter++;
        break;

      case 0xAD:
        // Load Memory to Accumulator
        if (this.stepCounter == 0x03) {

          this.irx = this.opp; // Load irx with opperand

          this.step--;
          this.stepCounter++;
        
        } else {
        
          this.iry = this.opp; // Load iry with opperand
          this.acc = this._MMU.readImmediate([this.irx, this.iry]); // Store data from memory in accumulator

          this.step++;
          this.stepCounter++;
        
        }

        break;
      case 0x8d:
        // Store accumulator in memory
        if (this.stepCounter == 0x03) {
        
          this.irx = this.opp; // Store opperand in irx

          this.step--;
          this.stepCounter++;

        } else {

          this.iry = this.opp; // Store opperand in ry
          this._MMU.writeImmediate([this.irx, this.iry], this.acc); // Write accumulator to location
        
          // Continue to writeback
          this.step++;
          this.stepCounter++;

        }
        break;

      case 0x6D:
        // Adds accumulator to memory location, store result in accumulator
        if (this.stepCounter == 0x03) {

          this.irx = this.opp; // Copy first operand to irx
        
          this.step--;
          this.stepCounter++;
        
        } else if(this.stepCounter == 0x04) {

          this.iry = this.opp; // Copy second operand to iry
                  
          this.stepCounter++;
        
        } else {

          this.acc = this.acc + this._MMU.readImmediate([this.irx, this.iry]); // Add data in memory to accumulator
        
          if (this.acc > 0xFF) {
            // Handles when a value is larger than normal 8 bits
            // The program will crash upon such cases.
            this.log("CRASH HALT: ACCUMULATOR OVERFLOW")
            this._SYSTEM.stopSystem();
        
          }

          this.stepCounter++;
          this.step++;
        }
        break;
      case 0xEC:
        // Compare data in memory location to x register
        if (this.stepCounter == 0x03){

          this.irx = this.opp; // store operand into irx

          // Decrement step to fetch more opperands
          this.step--;
          this.stepCounter++;
        
        } else if (this.stepCounter == 0x04){
        
          this.iry = this.opp; // store operand into iry

          this.stepCounter++;
        
        } else {
        
          if (this.xReg == this._MMU.readImmediate([this.irx, this.iry])) {
        
            this.zFlag = 0; // Sets zero flag to 0 if they are equal
        
          } else {
        
            this.zFlag = 1; // Sets zero flag to 1 if they are not equal
        
          }
        
          this.step++;
          this.stepCounter++;
        }
        break;

      case 0xEA:

        // Does nothing
        this.step++;
        break;

      case 0xD0:

        // Branch (operand is in two's comp)
        if(this.zFlag) {
          // Jumps program counter to specified location
          this.pc = (this.pc + this.opp) % 0x100;
        }

        this.step++;
        this.stepCounter++;
        break;

      case 0xA2:

        // Loads the X register with a constant
        this.xReg = this.opp;

        this.step++;
        this.stepCounter++;
        break;

      case 0xAE:

        // Loads the X register with data in memory
        if(this.stepCounter == 0x03) {
          
          // Store opperand and go back to fetch
          this.irx = this.opp;

          this.step--;
          this.stepCounter++;

        } else if (this.stepCounter == 0x04) {

          // Load iry with opperand
          this.iry = this.opp;

          this.stepCounter++;

        } else {

          // Copy data from memory to xReg
          this.xReg = this._MMU.readImmediate([this.irx, this.iry]);

          this.step++;
          this.stepCounter++;

        }
        break;

      case 0xA0:

        // Loads the Y register with a constant
        this.yReg = this.opp;
        
        this.step++;
        this.stepCounter++;
        break;

      case 0xAC:

        // Loads the Y register with data in memory
        if(this.stepCounter == 0x03) {

          // Store opperand and go back to fetch
          this.irx = this.opp;

          this.step--;
          this.stepCounter++;

        } else if (this.stepCounter == 0x04){

          this.iry = this.opp;

        } else {

          // Copy data from memory to y register
          this.yReg = this._MMU.readImmediate([this.irx, this.iry]);

          this.step++;
          this.stepCounter++;

        }

        break;

      case 0xEE:

        // Catch opperand and refetch for another opperand.
        if (this.stepCounter == 0x03) { // Captures first operand and puts into irx
        
          this.step--;
          this.irx = this.opp;
        
        } else { // captures second opperand, stores in iry and continues to writeback.
        
          this.iry = this.opp;

          this.step++;
          this.stepCounter++;
        
        }

        break;

      case 0xFF:

        // Syscall, prints integer or string depending on x register value

        if (this.xReg == 0x01) { // Display an Integer
          
          this.log("Displaying Integer");

          process.stdout.write(this.yReg.toString(16)); // Output y Register as decimal integer
          
          this.step++;
          this.stepCounter++;

        } else if(this.xReg = 0x02) {
          
          if (this.stepCounter == 0x03){
          
            this.irx = this.opp; // Store opperand in irx
            
            this.step--;
            this.stepCounter++;
            
          } else {
          
            this.iry = this.opp; // Store opperand in iry

            // Copy data from memory to a temporary variable
            var tmpvar = this._MMU.readImmediate([this.irx, this.iry]);

            if (tmpvar != 0x00) { // If the temporary variable is 0x00, end, otherwise

              this.log("Displaying String");

              process.stdout.write(this.ascii.toAscii(tmpvar)) // Output y Register as ascii output

              this.irx++; // Increment irx
              
              if (this.irx > 0xFF) { // If IRX is too big, increment iry and reset irx
              
                this.irx = 0x00;
                this.iry++;
              
              }
              
              this.stepCounter++;
            
            } else {
              
              // Move on if tmpvar is 0x00
              this.step++;
              this.stepCounter++;
            
            }
          
          }
        }

        break;
      case 0x00:

        // halt program
        this.log("PROGRAM HALT: END PROGRAM");

        this._SYSTEM.stopSystem();
        break;
    }
  }

  public writeBack(){
    /**
     * Writes data back to the cache rather than directly to memory.
     */
    switch(this.ir) {
      case 0xEE:
        // INC, Increments memory location

        // Burns two cycles in this operation rather one
        this.acc = this._MMU.readImmediate([this.irx, this.iry]); // Grab memory location

        this.acc += 1; // Increment accumulator
        
        this._MMU.writeImmediate([this.irx, this.iry], this.acc); // Copy Incremented data from accumulator
        
        this.stepCounter++;
    }
    
    this.step++;
    this.stepCounter++;
  }

  public interruptCheck(){
    /**
     * Checks for an interrupt and determines the course of action.
     */
    var interrupt = this._INTCONTROLLER.getInterrupt(); // Grab a new interrupt

    if (interrupt != null) { // If there was an interrupt in the buffer,
      
      var inval = interrupt.inbuf.dequeue(); // Dequeue from the iterrupt's input buffer

      if (inval != null) { // If the value exists display it
        
        this.log("Input Buffer from " + interrupt.name + ":" + inval);
      }

      var outval = interrupt.outbuf.dequeue(); // Dequeue from interrupt's output buffer

      if (outval != null) { // If the value exists display it
          
        this.log("Output buffer from " + interrupt.name + ":" + outval);
      }
    }
    
    // Reset step counters
    this.step = 0x00;
    this.stepCounter = 0x00;
  }
}
