export class Report{
    run()
    {

        let consoleResult = "CPU limit:" + Game.cpu.limit;
        consoleResult += "\nCPU tickLimit: " +Game.cpu.tickLimit;
        consoleResult += "\nCPU bucket: " +Game.cpu.bucket;

        let cpu_average = 0;
        let cpu_high = 0;
        let cpu_low = 9999;
        for(let i = 1; i < Memory.report.length; i++)
        {
            if(cpu_high < Memory.report[i])
                cpu_high = Memory.report[i];
            

            if(cpu_low > Memory.report[i])
                cpu_low = Memory.report[i];

            cpu_average += Memory.report[i];
        }
        cpu_average /= 19;

        consoleResult += "\nCPU used: " + cpu_average + " " + Math.round(cpu_average/cpu_high*100) + "%";
        consoleResult += "\nCPU High: " + cpu_high + "\tCPU Low: " + cpu_low;

        Object.keys(Memory.lar)
            .forEach(function (key)
            {
                let creeps = Memory.lar[key].creeps;
                consoleResult += "<h5>" + Memory.lar[key].name + "</h5>";
                consoleResult += "\n#Creeps: " + creeps.length;
                let builders = creeps.filter(function(c)
                {
                    return c.memory.role == "builder";
                }).length;
                consoleResult += "\n\t#Builders: " + builders;

                let upgraders = creeps.filter(function(c)
                {
                    return c.memory.role == "upgrader";
                }).length;
                consoleResult += "\n\t#Upgraders: " + upgraders;

                let haulers = creeps.filter(function(c)
                {
                    return c.memory.role == "hauler";
                }).length;
                consoleResult += "\n\t#Haulers: " + haulers;

                let dispensers = creeps.filter(function(c)
                {
                    return c.memory.role == "dispenser";
                }).length;
                consoleResult += "\n\t#Dispensers: " + dispensers;

                let miners = creeps.filter(function(c)
                {
                    return c.memory.role == "miner";
                }).length;
                consoleResult += "\n\t#Miners: " + miners;

                let harvesters = creeps.filter(function(c)
                {
                    return c.memory.role == "harvester";
                }).length;
                consoleResult += "\n\t#Harvesters: " + harvesters;



            });


        console.log(consoleResult);
    }
};