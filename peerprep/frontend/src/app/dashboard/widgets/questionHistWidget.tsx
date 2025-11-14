import { History, FileQuestionMark, CircleCheck } from "lucide-react"
import { useRouter } from "next/navigation";

interface QuestionHistoryWidgetProps {
    totalAttempts?: string;
    successfulAttempts?: string;
}

export default function QuestionHistoryWidget({ totalAttempts, successfulAttempts }: QuestionHistoryWidgetProps){
    const router = useRouter();
    return(
        <div className="h-full w-full flex flex-col items-center">
            <p className="font-poppins text-text-dark-purple text-xl font-bold px-4 p-2">
                Practise makes perfect. Review your past attempts, get AI feedback and learn better ways to solve the problems!
            </p>
            <button className="bg-light-box p-8 m-4 rounded-4xl h-12 w-full flex flex-row items-center justify-center space-x-4 hover:bg-darkest-box"
                onClick={() => router.push('/attemptHistoryOverview')}>
        
                <History className="w-10 h-10 text-logo-purple stroke-2"/>
                <p className="font-poppins text-2xl text-white">View all attempts</p>
            </button>
            <p className="font-poppins text-text-main text-2xl font-bold px-4">
                Analytics
            </p>
            <div className="w-1/2 bg-dark-box rounded-3xl border-2 border-logo-purple flex flex-col justify-center items-center p-6 m-4 gap-3">
                <div className="flex flex-row gap-2 items-center">
                    <FileQuestionMark className="w-10 h-10 text-logo-purple stroke-2"/>
                    <p className="font-poppins text-logo-purple text-5xl"> {totalAttempts} </p>
                </div>
                <p className="font-poppins text-logo-purple text-2xl">Questions attempted</p>
            </div>
            <div className="w-1/2 bg-green-box rounded-3xl border-2 border-logo-green flex flex-col justify-center items-center p-6 m-4 gap-3">
                <div className="flex flex-row gap-2 items-center">
                    <CircleCheck className="w-10 h-10 text-logo-green stroke-2"/>
                    <p className="font-poppins text-logo-green text-5xl"> {successfulAttempts} </p>
                </div>
                <p className="font-poppins text-logo-green text-2xl">Successfully solved</p>
            </div>
        </div>
    )
}