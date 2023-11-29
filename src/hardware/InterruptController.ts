import { throws } from "assert";
import { System } from "../System";
import { Hardware } from "./Hardware";
import { ClockListener } from "./imp/ClockListener";

export class InterruptController extends Hardware implements ClockListener {
    private InterruptQueue = class {
        /**
         * Interrupt Queue: Priority Queue capable of storing interrupts and ordering based on IRQ
         */

        // Stores head and tail of PQ
        public head = null;
        public tail = null;
        
        private Node = class {
            // This IS a Deque used within the Priority Queue
            public next = null;
            public prev = null;
            public data = null;

            constructor(val) {
               this.data = val;
               // Constructor requires a value to be stored
            }
        }
        
        constructor() {
            
        }

        public enqueue(val){
            // Create new node with given value
            var tmp = new this.Node(val);

            // If the queue is empty
            if(this.tail == null) {
                // Set the head and tail to the new node
                this.tail = tmp;
                this.head = tmp;

            } else {

                // Use temporary variable to store the tail
                var tmptail = this.tail;

                // Iterate until we find another node with the same priority or the head.
                while(tmptail.data.priority < tmp.data.priority) {
                    tmptail = tmptail.next
                }

                // If the tmptail is not at the tail
                if (tmptail.prev != null) {

                    // Set the previous node's next to tmp
                    tmptail.prev.next = tmp;
                    //            tmp
                    //             V
                    // tmptail ... tmp <- tmptail.prev
                } else {
                    // Set the tail to tmp otherwise. This means we are at the tail and we did not move at all
                    this.tail = tmp;
                }
                
                // Copy the tmptail to tmp's next
                tmp.next = tmptail;
                // Copy tmptail's prev to tmp's prev
                tmp.prev = tmptail.prev;
                // copy tmp to tmptail's prev
                tmptail.prev = tmp;

                // tmptail <-> tmp <-> tmptail.prev
            }
        }

        public dequeue() {
            // Pops the head of the queue off and returns it

            // If the queue is empty, return null
            if(this.head == null) {

                return null;

            } else {
                // copy the head to a tmp variable
                var tmp = this.head;

                // If this is the last node in the queue
                if (this.head == this.tail) {

                    // Set head and tail to null to signify the queue is empty
                    this.head = null;
                    this.tail = null;

                } else {
                    // Copy head's previous to head
                    this.head = this.head.prev;
                    // set new head's next to null. We don't want the queue to try and place a new node ahead of the head
                    this.head.next = null;
                }

                // Return the old head's data
                return tmp.data;
            }
        }

    };

    /**
     * Class only variables
     */
    private devices = []; // Stores an instance of each device that is handled by the interrupt controller
    private interrupts = new this.InterruptQueue(); // Interrupt queue with each interrupt
    private intClockCount = 0; // Clock count
    
    constructor(id) {
        super(id, "INTCONTROLLER"); // Initialize with super class
    }

    public pulse() {

        this.intClockCount++; // increment clock pulse

        this.log(
        // log that a clock pulse has been recieved
        "received clock pulse - MEM Clock Count: " +
            this.intClockCount.toString(10)
        );
        
    }

    public addDevice(device) {
        this.log("Added new device" + device.name) // Log the device

        device.debug = this.debug; // Copy interrupt controller's debug flag to device
        
        this.devices.push(device); // Add device to device array
    }

    public acceptInterrupt(device) {
        // Log the interrupt and enqueue into the interrupt buffer
        this.log("Recieved Interrupt from " + device.name)

        // When enqueued, it will insert based on priority. This will be appended behind the last interrupt of the same priority.
        this.interrupts.enqueue(device);
    }

    public getInterrupt() {
        // Dequeue the interrupt
        var interrupt = this.interrupts.dequeue();

        // Return the interrupt to the cpu (Because that's the only piece of hardware that interacts with the IC)
        return interrupt;
        
    }

}