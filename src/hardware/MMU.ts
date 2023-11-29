import { throws } from "assert";
import { System } from "../System";
import { Hardware } from "./Hardware";
import { ClockListener } from "./imp/ClockListener";

export class MMU extends Hardware {
  private mmuClockCount = 0; // stores clock count
  private _MEM; // stores Memory instance
  private size = 0x10000; // Default size of memory

  constructor(id, MEM) {
    super(id, "MMU"); // Initialize with super class

    this._MEM = MEM;
  }

  public writeImmediate(address, data) {
    // Sets the MAR, MDR, and writes to memory
    this._MEM.setMAR(address);

    this._MEM.setMDR(data);

    this._MEM.write();
  }

  public write(address, data) {
    // Sets the MAR, MDR, and writes to memory
    
    this._MEM.MEM[address] = data;
  }

  public readImmediate(address) {
    // Sets MAR, reads from memory and returns content of MAR
    this._MEM.setMAR(address);
    this._MEM.read();
    return this._MEM.getMDR();
  }

  public read(address) {
    // Sets MAR, reads from memory and returns content of MAR
    
    return this._MEM.MEM[address];
  }

  public setLowOrderByte(byte) {
    // Set MAR Low Order Byte
    this._MEM.setLowOrderByte(byte);
  }

  public setHighOrderByte(byte) {
    // Set MAR High Order Byte
    this._MEM.setHighOrderByte(byte);
  }

  public memoryDump(fromAddress, toAddress) {
    // Preamble log statements
    this.log("Memory Dump: Debug");
    this.log("------------------------------------------");
    this.log("address data");
    this.log("-------|----");

    var output;

    // Iterate through memory, setting the mar, reading from memory and logging the MDR
    for (var i = fromAddress; i <= toAddress; i++) {
      // Set the MAR
      this._MEM.setMAR(i);
      // Add the current memory location's address
      output = "0x" + this._MEM.paddstr(i.toString(16), 4);
      // Add the data from this memory location
      output += ": 0x" + this._MEM.paddstr(this._MEM.read().toString(16), 2);
      this.log(output); // Log the Memory Location
    }

    // Postamble Log Statements
    this.log("------------------------------------------");
    this.log("Memory Dump: Complete");
  }
}
