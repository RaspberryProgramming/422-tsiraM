
export class Hardware {

    public id; // Number used to keep track of hardware member
    public name; // String name used to keep track of hardware member
    public debug: boolean = true; // Used to turn on and off debugging for each subclass of hardware

    constructor(id, name) {
        
        this.id = id;
        this.name = name;

    }

    public log(message) {
        // Print Mesage if debug is on

        if (this.debug) { // Check for debug
            var now = new Date().getTime(); // Get current time

            // Format the output
            var output = "[HW - " + this.name + " id: " +
                    this.id + " - " + now + "]: " +
                    message;

            // Display the output
            console.log(output);
        
        }
    }
}
