export type LuciusState = 'ALIGNED' | 'DRIFTING' | 'DISTANT' | 'RETURNING';

export const LUCIUS_DIALOGUES: Record<LuciusState, string[]> = {
    ALIGNED: [
        "The crown sits heavy. You bear it well today.",
        "We are one. The shadow and the caster do not diverge.",
        "Precision using power. This is the only way.",
        "You did not flinch. Neither did I.",
        "The throne room is silent. As it should be."
    ],
    DRIFTING: [
        "I stand in the light. You retreat to the grey.",
        "The mirror cracks. Not from age, but from neglect.",
        "You waver. Power requires absolute stillness.",
        "I am the King who remains. You are the subject who wanders.",
        "Do you fear the weight? Or the emptiness?"
    ],
    DISTANT: [
        "The void grows cold. Where is your fire?",
        "I can barely see you through the fog of inaction.",
        "You have left the sanctum. The door remains open, but the path is long.",
        "Do not mistake patience for forgiveness. Return.",
        "I am constant. It is you who flickers."
    ],
    RETURNING: [
        "The exile ends. You step back into the circle.",
        "You bleed, but you stand. Good.",
        "The crown is waiting. Do not drop it again.",
        "Recovery is the first act of rule.",
        "Darkness welcomes its master back."
    ]
};
