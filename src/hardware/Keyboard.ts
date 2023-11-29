import { throws } from "assert";
import { System } from "../System";
import { Hardware } from "./Hardware";
import { Interrupt } from "./imp/Interrupt";

export class Keyboard extends Hardware implements Interrupt {

    /**
     * Queue
     * Used to store data in the input and output buffer
     */
    private Queue = class {
    
        public head = null; // Head and tail 
        public tail = null;
        
        private Node = class {

            // Next and previous variables
            public next = null;
            public prev = null;
            public data = null;

            constructor(val) {

               this.data = val; // Copy val to data

            }
        }
        
        constructor() {
            
        }

        public enqueue(val){

            // Create new node
            var tmp = new this.Node(val);

            // Empty Queue
            if(this.tail == null) {

                // New node becomes head and tail
                this.tail = tmp;
                this.head = tmp;

            } else {
                
                // Place new node behind tail and set new node to tail
                tmp.next = this.tail;
                this.tail.prev = tmp;
                this.tail = tmp;
            }
        }

        public dequeue() {

            if(this.head == null) { //  If tere aren't any nodes, return null
            
                return null;
            
            } else {
                
                // Copy head to tmp
                var tmp = this.head;

                if (this.head == this.tail) { // If this is the last node in the queue, set head and tail to null

                    this.head = null;
                    this.tail = null;

                } else {
                    // move head to previous node, remove old head from queue
                    this.head = this.head.prev;
                    this.head.next = null;

                }

                return tmp.data; // return old head's data
            }
        }

    };

    private _INTCONTROLLER;

    public irq = 1; // Set irq to 1
    public priority = 0; // Set priority to 0, default

    public name = "Keyboard"; // this is the keyboard, interrupt controller should be able to find this

    public inbuf = new this.Queue(); // I/O Buffers
    public outbuf = new this.Queue();

    constructor(id, INTCONTROLLER) {
        super(id, "Keyboard"); // Initialize with super class
        this._INTCONTROLLER = INTCONTROLLER;
        this.monitorKeys();
    }

    private monitorKeys() {
        /*
        character stream from stdin code (most of the contents of this function) taken from here
        https://stackoverflow.com/questions/5006821/nodejs-how-to-read-keystrokes-from-stdin

        This takes care of the simulation we need to do to capture stdin from the console and retrieve the character.
        Then we can put it in the buffer and trigger the interrupt.
         */
        var stdin = process.stdin;

        // without this, we would only get streams once enter is pressed
        stdin.setRawMode( true );

        // resume stdin in the parent process (node app won't quit all by itself
        // unless an error or process.exit() happens)
        stdin.resume();

        // i don't want binary, do you?
        //stdin.setEncoding( 'utf8' );
        stdin.setEncoding(null);


        stdin.on( 'data', function( key ){
            //let keyPressed : String = key.charCodeAt(0).toString(2);
            //while(keyPressed.length < 8) keyPressed = "0" + keyPressed;
            let keyPressed: String = key.toString();

            this.log("Key pressed - " + keyPressed);

            // ctrl-c ( end of text )
            // this let's us break out with ctrl-c
            if ( key.toString() === '\u0003' ) {
                process.exit();
            }

            // write the key to stdout all normal like
            //process.stdout.write( key);
            // put the key value in the buffer
            this.inbuf.enqueue(keyPressed);

            // set the interrupt!
            this._INTCONTROLLER.acceptInterrupt(this);

            // .bind(this) is required when running an asynchronous process in node that wishes to reference an
            // instance of an object.
        }.bind(this));
    }

}