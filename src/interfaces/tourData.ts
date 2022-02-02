export default interface TourData
{
    round: string,
    bestOf?: number,
    banCount?: number,
    maps: {
        mod: string,
        mapID: string
    }[]
    matches: {
        match: string,
        dateTime: Date,
        leftSide?: string,
        rightSide?: string,
        referee?: string,
        streamer?: string,
        comms1?: string,
        comms2?: string
        leftScore?: number,
        rightScore?: number
    }[]
}