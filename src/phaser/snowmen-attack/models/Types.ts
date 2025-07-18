// This interface represents the structure of the questions that will be dynamically generated later on.
// id : to easily track unanswered questions
// answer: the correct answer
// options: dynamically populated with 4 options for each question including the answer (correct answer and 3 other options)
//speedMultiplier: default value = 1.0, must increment it for every wrong attempt by the player or increment it based on other game logic not yet specified.

export interface Question{
    id:number,
    operand1:number,
    operand2:number,
    answer:number,
    options:number[],
    speedMultiplier:number
}

export interface WrongAttempt{
    orderOfAppearance:number, // this will help in reviewing wrong attempts in order in the review scene
    question:Question,
    attemptedAnswer:number,
}
export interface RightAttempt{
    orderOfAppearance:number, 
}
