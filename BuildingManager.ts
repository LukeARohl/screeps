//Imports
import {Room} from "./Room";
import {Util} from "./Util";

export class BuildingManager{
    constructor()
    {
    }

    /**
     * Will determine what buildings are missing from the current level and place the constructionSites for them.
     * //TODO
     * @param {Room} room - the room which needs to be analyzed
     */
    runRoom(room:Room):void
    {
        //TODO
        return;
        switch(get_controller(room).level)
        {
            case 8:
            case 7:
            case 6:
            case 5:
            case 4:
            case 3:controller_level_3(room);
                break;
            case 2:controller_level_2(room);
                break;
            case 1://Controller_level_1 there is nothing to do
                break;
            default:
                console.log("BuildingManager - runRoom - Controller Level defaulted: " + get_controller(room).level)
        }
    }
}

function controller_level_2(room:Room):void
{
    //check if 5 extensions are present
     if(get_extensions(room).length < 5)
     {
         //TODO place a construction site for the missing extensions
     }
}

function controller_level_3(room:Room):void
{
    //check if 10 extensions are present
    if(get_extensions(room).length < 10)
    {
        //TODO place a construction site for the missing extensions
    }

    //check if tower is present
    if(get_towers(room).length < 1)
    {
        //TODO place a construction site for the missing tower
    }

}

function  controller_level_4(room:Room):void
{
    //TODO
    //check if 20 extensions are present

}


function get_storage(room:Room):any
{
    return room.room.storage;
}

function get_controller(room:Room):any
{
    return room.room.controller;
}

function get_containers(room:Room):any[]
{
    return room.buildings.filter(function(b)
    {
       return b.type == STRUCTURE_CONTAINER;
    });
}

function get_extensions(room:Room):any[]
{
    return room.buildings.filter(function(b)
    {
        return b.type == STRUCTURE_EXTENSION;
    });
}

function get_spawns(room:Room):any[]
{
    return room.spawns;
}

function get_towers(room:Room):any[]
{
    return room.towers;
}