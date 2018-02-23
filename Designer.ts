
export class Designer{
    constructor(){}

    designCreep(room,role, force = false):string[]
    {
        //console.log("Room: " + room.name + "\nRole: " + role + "\nForce: " + force);
        let result_bodyParts = [];
        let bodyParts:string[];
        let plannedEnergy:number = 0;
        let limit:number = -1;
        switch(role)
        {
            case 'miner':
                bodyParts = [MOVE,WORK,WORK,WORK,WORK,WORK];
                limit = 1;
                break;
            case 'dispenser':
                bodyParts = [MOVE,MOVE,CARRY,CARRY];
                limit = 1;
                break;
            case 'hauler':
                bodyParts = [MOVE,MOVE,CARRY,CARRY,MOVE,MOVE,CARRY,CARRY];
                limit = 1;
                break;
            default:
                bodyParts = [MOVE,MOVE,MOVE,WORK,CARRY,CARRY,WORK];
                limit = 2;
        }

        limit = limit * bodyParts.length;
        //console.log(JSON.stringify(bodyParts));
        let i = 0;
        let j = 0;
        while(plannedEnergy < room.energyCapacityAvailable && j < limit)
        {
            if(i == bodyParts.length)
            {
                i = 0;
            }

            //console.log(BODYPART_COST[bodyParts[i]]);
            if(BODYPART_COST[bodyParts[i]] + plannedEnergy > room.energyCapacityAvailable)
            {
                //console.log("Too much cost!");
                break;
            } else if(force && BODYPART_COST[bodyParts[i]] + plannedEnergy > room.energyAvailable)
            {
                break;
            }

            plannedEnergy += BODYPART_COST[bodyParts[i]];
            //console.log(JSON.stringify("select body: " + bodyParts + "\nresult_body: " + result_bodyParts));
            result_bodyParts.push(bodyParts[i]);

            i++;
            j++;
        }
        //console.log("Planned Energy: " + plannedEnergy + "\n" + JSON.stringify(result_bodyParts));
        return result_bodyParts;
    }
}