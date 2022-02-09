export default interface DraftData
{
    side: "left" | "right",
    action: "pick" | "ban",
    mapIndex: "PLACEHOLDER" | number
}