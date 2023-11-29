import { System } from "../System";
import { Hardware } from "./Hardware";
import { ClockListener } from "./imp/ClockListener";
export class Memory extends Hardware implements ClockListener {
  private MAR = 0x0000; // Memory Address Register [2 bytes in size in Little Endian]
  private MDR = 0x00; // Memory Data Register [1 byte in size]
  public MEM = new Array<number>(0x10000); // variable that stores memory of system [10000 bytes in size]
  public size = 0x10000; // Static size that says how many bytes there are in the memory
  private memClockCount = 0; // stores clock count

  constructor(id) {
    super(id, "MEM"); // Initialize with super class

    this.initMemory(0x10000);
  }

  public initMemory(size) {
    /**
     * initMemory: clears all memory and sets to 0x00
     *
     */
    for (var i = 0x00; i < size; i++) {
      this.MEM[i] = 0x00; // set memory address to 0x00 / clear memory address
    }

    this.log("Created - Addressable space : " + size);
  }

  public displayMemory(startAdd, length) {
    /**
     * displayMemory: Logs memory from 0x00 to address passed to function
     *
     * endAddress: the last address to log
     */
    if (typeof startAdd == "string") {
      startAdd = this.unpaddstr(startAdd);
      startAdd = startAdd.hexEncode().hexDecode();
    }

    var stopAdd = startAdd + length;

    for (var i = startAdd; i <= stopAdd; i++) {
      this.hexLog(i); // Log memory location
    }
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

  public hexLog(address) {
    /**
     * hexLog: Logs hex data located at address passed to the function
     *
     * address: address to extract data from and log
     */

    if (address >= this.MEM.length || address < 0x00) {
      // Set value to an error if the given address is out of bounds
      var value = "ERR [hexValue conversion]: number undefined"; // Set value to an error message if the address is out of bounds
    } else {
      // Extract hex value as hex from the address

      value = "0x" + this.paddstr(this.MEM[address], 2); // Set value to the value at the passed address location
    }

    var straddr = address.toString(16);
    straddr = "0x" + this.paddstr(straddr, 4);

    // Log the address and value in hex
    this.log("Address : " + straddr + " Contains Value: " + value); // Log full message
  }

  public pulse() {
    this.memClockCount++; // increment clock pulse

    this.log(
      // log that a clock pulse has been recieved
      "received clock pulse - MEM Clock Count: " +
        this.memClockCount.toString(10)
    );
  }

  public reset() {
    // Resets all memory space in Memory/MMU
    this.MAR = 0x0000; // Memory Address Register [2 bytes in size]
    this.MDR = 0x00; // Memory Data Register [1 byte in size]

    this.initMemory(this.size);

    this.log("Created - Addressable space : " + this.size);
  }

  /*******************************
   * PRIVATE METHODS
   *******************************/

  /********************************
   * Getters
   ********************************/
  private read() {
    // Copy data from MAR to MDR
    this.copy2MDR();

    // Return the MDR
    return this.getMDR();
  }

  private getMDR() {
    // Return the MDR
    return this.MDR;
  }

  private getMAR() {
    // Return the MAR
    return this.MAR;
  }

  /********************************
   * Setters
   ********************************/

  private setLowOrderByte(byte) {
    var tmpmar = this.address2array(this.getMAR()); // Get mar value

    tmpmar[1] = byte; // Replace Low Order Byte with Byte

    this.MAR = this.array2address(tmpmar); // Convert MAR Array to hex Address
  }

  private setHighOrderByte(byte) {

    var strbyte = byte.toString(16); // Extract string from byte

    var tmpmar = this.address2array(this.getMAR()); // Get mar value as array

    tmpmar[0] = parseInt(this.paddstr(strbyte, 2)); // Replace High Order Byte with Byte

    this.MAR = this.array2address(tmpmar); // Convert Array Address to a hex address

  }

  private setMAR(addr) {

    // Sets the MAR

    if (Array.isArray(addr)) {
      // If the address is an array, immediately set high/low order bytes
      this.setHighOrderByte(addr[1]);
      this.setLowOrderByte(addr[0]);
    } else {
      // If the address is a hex address, convert to address array
      addr = this.address2array(addr);

      // Set MAR high/low order bytes from the array
      this.setHighOrderByte(addr[1]);
      this.setLowOrderByte(addr[0]);
    }
    
  }

  private setMDR(data) {
    this.MDR = data; // Write data to MDR
  }

  private write() {
    this.copy2MEM(); // copy value in MDR at location stored in MAR of MEM
  }

  /********************************
   * Conversions
   ********************************/

  private array2address(arr) {

    var temp = ""; // Stores the addr

    // Iterate 0 -> 1
    for (var i = 0; i <= 1; i++) {
      // Convert to string, padd and append the the temp sting
      temp = temp + this.paddstr(arr[i].toString(16), 2);
    }

    // Convert temp to a hex int
    return parseInt(temp, 16);
  }

  private address2array(addr) {
    var temp = [0x00, 0x00]; // Stores output as it's being modified
    addr = this.paddstr(addr.toString(16), 4).replace("0x", ""); // Convert address to string

    for (var i = 0; i <= 1; i++) {
      // jumps by 2, iterates 0,
      temp[i] = parseInt(addr.substring(3 - (i * 2) - 1, 4 - i * 2), 16); // copy two bytes to current temp, convert to hex
    }

    return temp; // Return temp
  }

  private reverseArray(arr) {
    // Used to reverse an array when high order/low order bytes could be reversed
    var tmparr = {};

    // Iterate through arr
    for (var i = 0; i < arr.length; i++) {
      tmparr[i] = arr[arr.length-i-1]; //set tmp arr to 
    }

    return tmparr; //  Return tmparr
  }

  /********************************
   * Copy Methods
   ********************************/

  private copy2MDR() {
    // Copy from address stored in MAR to the MDR
    
    // Convert MAR to array
    var addr = this.address2array(this.MAR);
    // Reverse the array
    var arr = this.reverseArray(addr);
    // Convert to Hex Address
    var newaddr = this.array2address(arr);

    // Copy data from MEM to MDR
    this.MDR = this.MEM[newaddr]; // Copy data from MEM at location stored in MAR to MDR
  }

  private copy2MEM() {

    // Convert MAR to an array
    var addr = this.address2array(this.MAR);
    // Reverse the array
    var arr = this.reverseArray(addr);
    // Convert to Hex Address
    var newaddr = this.array2address(arr);

    this.MEM[newaddr] = this.MDR; // Copy MDR to MEM at location stored in MAR
  }
}
