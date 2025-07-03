import { Question } from "../models/Types";
function generatePossibleAnswersForTable(table:number): number[]{
        //generate possible answers for the current table
        //this will help in selecting the 3 random options for the answers
        const possibleAnswersForTable:number[]= []
        for(let k=1;k<=10;k++){
            possibleAnswersForTable.push(table*k)
        }
        return possibleAnswersForTable
}
function generateQuestionsForTables(selectedTables: number[]): Question[] {
    
    const questions: Question[] = [];
    for (let i = 0; i < selectedTables.length; i++) {
        const table = selectedTables[i];
        const possibleAnswersForTable:number[] = generatePossibleAnswersForTable(table);
        
        //generaet the Question object
        for (let j=1;j<=10;j++){
            const operand1 = table;
            const operand2 = j;
            const answer = operand1 * operand2;
            const options = generateOptions(answer, possibleAnswersForTable);
            shuffle(options)
            const q:Question= {id:answer*operand1,operand1,operand2,answer,options,speedMultiplier:1.0}
            questions.push(q)
        }    
    }
    shuffle(questions)
    console.log(questions)
    return questions;
}
export {generateQuestionsForTables,generatePossibleAnswersForTable,generateOptions};


function generateOptions(correctAnswer: number, possibleAnswers: number[], count = 4): number[] {
    const options = new Set<number>();
    options.add(correctAnswer);

    while (options.size < count) {
        let candidate = possibleAnswers[Math.floor(Math.random() * possibleAnswers.length)];

        while (options.has(candidate)) {
            candidate = possibleAnswers[Math.floor(Math.random() * possibleAnswers.length)];
        }

        options.add(candidate);
    }

    return Array.from(options);
}


function shuffle<T>(array:T[]) {
    //Fisher-Yates shuffle algorithm 
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
}