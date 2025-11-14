"use client";
import React, { Suspense } from "react"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import AiFeedback from "./components/AiFeedback";

const ATTEMPT_HISTORY_API_URL = `${process.env.NEXT_PUBLIC_ATTEMPT_HISTORY_SERVICE_API_URL}/attempts` || "http://localhost:3004/attempts/";


function AttemptHistoryContent() {
    const router = useRouter();
    const codeAttempt = `Please store the code attempt string and pass to my AiFeedback component.`;
    //const question = `Please store the question string and pass to my AiFeedback component.`;
    // store attemptId from query param in a state
    const [storedAttemptId, setStoredAttemptId] = useState<any>(null);
    const [attemptDetails, setAttemptDetails] = useState<any>(null);
    const [question, setQuestion] = useState<any>(null);
    const [otherUserName, setOtherUserName] = useState<string>("");
    const [codeAttemptString, setCodeAttemptString] = useState<string>("");
    const [userName, setUserName] =  useState<string>("")
    const [questionDetails, setQuestionDetails] = useState<any>(null);
    

    const searchParams = useSearchParams();
    const attemptId = searchParams.get("attemptId") || "";
         // Make sure user is logged in + get userId and also userName


    async function fetchAttemptDetails(attemptId: string) {
        const url = `${ATTEMPT_HISTORY_API_URL}/attempt/${attemptId}`;
        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) {
                console.log("Failed to fetch attempt details data:", response.statusText);
                return;
            }
            const data = await response.json();
            console.log("Attempt details data:", data);
            setAttemptDetails(data);
            } catch (error) {
                console.error("Error fetching attempt details data:", error);
            }
        }
        
        // helper functions
        //1. take in ISO date string and convert to more readable format
        // e.g. "2023-06-15T12:34:56Z" -> "6/15/2023, 12:34:56 PM"
        function formatDateString(isoString: string): string {
            const date = new Date(isoString);
            return date.toLocaleString();
        }

        //2. extract question data frm attempt details
        function extractQuestionData(questionData: any){
                // if it's a string, try parse
                let dataObj = questionData;
                if (typeof dataObj === "string") {
                    try { dataObj = JSON.parse(dataObj); } catch (e) { /* leave it */ }
                }
                setQuestion(dataObj || "Unknown Question");
        }
        function getOtherUserName(attemptDetails: any) {
            if (!attemptDetails || !attemptDetails.userNames) return;
            try {
                let names = attemptDetails.userNames;
                if (typeof names === 'string') {
                    try { names = JSON.parse(names); } catch (e) { names = [names]; }
                }
                if (!Array.isArray(names)) names = [String(names)];
                const other = names.find((n: string) => n !== userName) || names[0];
                setOtherUserName(other || '');
            } catch (err) {
                console.error('Error extracting other user name', err);
            }
        }

        // Ensure user is logged in and capture username
        useEffect(() => {
            const user = sessionStorage.getItem("user");
            const token = sessionStorage.getItem("token");
            if (!user || !token) {
                router.push("/");
                console.error("You must be logged in to access this page.");
                return;
            }
            try {
                const parsedUser = JSON.parse(user);
                if (!parsedUser.id || !parsedUser.username) {
                    router.push("/");
                    console.error("Invalid user data in session storage:", parsedUser);
                    return;
                }
                setUserName(parsedUser.username);
            } catch (e) {
                console.error('Failed to parse user from sessionStorage', e);
                router.push('/');
            }
        }, [router]);

        // Fetch attempt details when attemptId changes
        useEffect(() => {
            setStoredAttemptId(attemptId);
            if (attemptId) {
                fetchAttemptDetails(attemptId);
            }
        }, [attemptId]);

        // Process attemptDetails when fetched
        useEffect(() => {
            if (!attemptDetails) return;
            extractQuestionData(attemptDetails.qnData);
            getOtherUserName(attemptDetails);
            if (attemptDetails.sharedCode) setCodeAttemptString(attemptDetails.sharedCode);
            setQuestionDetails(attemptDetails.questionData || null);
        }, [attemptDetails]);
 
    // formtat in a proper sting

    
    return (
    <div className="bg-dark-blue-bg w-full h-screen flex flex-col items-center overflow-clip">
        <div className="flex items-start w-full justify-between m-5 p-5 h-1/6">
            <div className="flex-col m-5 mb-0">
                <div className="flex items-start mb-5">
                    <span className="font-poppins text-white text-5xl font-bold">
                        Question Attempt on {formatDateString(attemptDetails?.connectedAtTime || "")}
                    </span>
                </div>
                <p className="font-poppins text-text-main text-4xl font-bold">
                    Attempt with {otherUserName}
                </p>
            </div>
            <div className="flex items-end">
                <button
                    className="bg-blue-button text-white p-4 rounded-3xl font-poppins text-2xl hover:bg-blue-button-hover"
                    onClick={() => { router.push('/attemptHistoryOverview') }}
                >
                    Back to Attempts
                </button>
            </div>
        </div>

        <div className="flex flex-row gap-10 h-5/6 w-full p-2">
            {/* Left: question + code (2/3 width) */}
            <div className="flex flex-col w-2/3 h-full gap-6 p-6">
                {/* Question area - take top half of left column */}
                <div className="rounded-4xl bg-light-box flex flex-col w-full h-2/5 p-4 overflow-y-auto">
                    <div className="flex flex-row items-center justify-between gap-8">
                        <p className="font-poppins text-text-main text-3xl font-bold ml-4">
                            {question?.title ?? "Loading question..."}
                        </p>

                        <div className="flex flex-row bg-black-box px-4 w-fit py-3 rounded-4xl gap-4 items-center">
                            <button
                                className={
                                    (question?.difficulty === "EASY"
                                        ? "bg-green-button-hover"
                                        : question?.difficulty === "MEDIUM"
                                            ? "bg-yellow-button-hover"
                                            : question?.difficulty === "HARD"
                                                ? "bg-red-button-hover"
                                                : "bg-gray-300 text-black") +
                                    " px-4 py-1.5 rounded-xl font-poppins"
                                }
                            >
                                {question?.difficulty ?? "Easy"}
                            </button>

                            <div className="bg-light-box w-1 h-10 rounded-4xl"></div>

                            <h1 className="font-poppins text-logo-purple font-bold overflow-y-auto">
                                {(question?.topics ?? []).join(" ")}
                            </h1>
                        </div>
                    </div>

                    <p className="font-poppins text-lg mt-4 ml-3 text-white">{question?.description ?? "Loading description..."}</p>
                </div>

                {/* Shared code area - take bottom half of left column */}
                <div className="flex flex-col w-full h-3/5 gap-4 text-white">
                    <p className="font-poppins text-2xl">Shared Code</p>
                    <div className="bg-darkest-box flex flex-col h-4/5 w-full p-6 overflow-y-auto rounded-2xl">
                        <pre className="whitespace-pre-wrap font-mono text-sm">{codeAttemptString}</pre>
                    </div>
                </div>
            </div>


            {/* Right: AI feedback (1/3 width) */}
            <div className="w-1/3 h-[77vh]">
                <div className="h-full rounded-4xl p-4 overflow-y-auto">
                    <AiFeedback codeAttempt={codeAttemptString} question={question?.description ?? "Loading description..."} />
                </div>
            </div>
        </div>
    </div>
    );
}

// Loading component for Suspense fallback
function LoadingPage() {
    return (
        <div className="bg-dark-blue-bg w-full h-screen flex flex-col items-center justify-center">
            <div className="flex flex-row mb-4">
                <span className="font-inter text-logo-purple text-6xl font-bold">Peer</span>
                <span className="font-inter text-logo-green text-6xl font-bold">Prep</span>
            </div>
            <p className="font-poppins text-text-main text-2xl font-medium">Loading attempt history...</p>
            <div role="status" className="mt-4">
                <svg aria-hidden="true" className="w-20 h-20 text-gray-200 animate-spin dark:text-blue-button fill-logo-purple" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                </svg>
                <span className="sr-only">Loading...</span>
            </div>
        </div>
    );
}

export default function AttemptHistory() {
    return (
        <Suspense fallback={<LoadingPage />}>
            <AttemptHistoryContent />
        </Suspense>
    );
}

