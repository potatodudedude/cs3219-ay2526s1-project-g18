"use client";
import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AttemptItem from "./components/attemptItem"

const ATTEMPT_HISTORY_API_URL = `${process.env.NEXT_PUBLIC_ATTEMPT_HISTORY_SERVICE_API_URL}/attempts` || "http://localhost:3004/attempts";



export default function AttemptHistoryOverviewPage() {
    // Ensure user is logged in and get userId
    const router = useRouter()
    const[userName, setUserName] =  useState<string>("")
    const[userId, setUserId] = useState<any>(null)
    const[questionAttempts, setQuestionAttempts] = useState<any[]>([])
    const[otherUserName, setOtherUserName] = useState<string>("")
    
     // Make sure user is logged in + get userId and also userName
      useEffect(() => {
            const user = sessionStorage.getItem("user");
            const token = sessionStorage.getItem("token");
            if (!user || !token) {
                router.push("/");
                console.error("You must be logged in to access this page.");
            } else {
                const parsedUser = JSON.parse(user);
                if (!parsedUser.id || !parsedUser.username ) {
                    router.push("/");
                    console.error("Invalid user data in session storage:", parsedUser);
                } else {
                    setUserName(parsedUser.username);
                    setUserId(parsedUser.id);
                }
            }
        }, [])
        // Now fetch the attempt history data by getting the whole list of jsons from the backend for this userId
        async function fetchAttemptHistory(userId: string) {
            const url = `${ATTEMPT_HISTORY_API_URL}/${userId}`;
            try {
                const response = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                if (!response.ok) {
                    console.log("Failed to fetch attempt history data:", response.statusText);
                    return;
                }
                const data = await response.json();
                setQuestionAttempts(data);
                console.log("Attempt history data:", data);
                // Here you would typically set state with the fetched data to render it
            } catch (error) {
                console.error("Error fetching attempt history data:", error);
            }
        }
        // helper functions
        //1. take in ISO date string and convert to more readable format
        // e.g. "2023-06-15T12:34:56Z" -> "6/15/2023, 12:34:56 PM"
        function formatDateString(isoString: string): string {
            const date = new Date(isoString);
            return date.toLocaleString();
        }
    // take in json data of questionData field of attempt and extract title
    // question data is a json object with various fields including title
    function extractQuestionTitle(questionData: any): string {
    if (!questionData) return "Unknown Title";

    // if it's a string, try parse
    let dataObj = questionData;
    if (typeof dataObj === "string") {
        try { dataObj = JSON.parse(dataObj); } catch (e) { /* leave it */ }
    }

    // handle multiple possible shapes: qnData, questionData, direct object with title
    return (
        dataObj.title ||
        dataObj.qnData?.title ||
        dataObj.question?.title ||
        dataObj.questionData?.title ||
        "Unknown Title"
    );
    }

    function getOtherUserName(attemptDetails: any): string {
        if (!attemptDetails || !attemptDetails.userNames) return "";
        try {
            let names = attemptDetails.userNames;
            if (typeof names === 'string') {
                try { names = JSON.parse(names); } catch (e) { names = [names]; }
            }
            if (!Array.isArray(names)) names = [String(names)];
            const other = names.find((n: string) => n !== userName) || names[0];
            return other || '';
        } catch (err) {
            console.error('Error extracting other user name', err);
            return "";
        }
    }

    useEffect(() => {
        if (userId) {
            fetchAttemptHistory(userId);
        }
    }, [userId]);

    return(
    <div className="min-h-screen bg-dark-blue-bg w-full flex flex-col items-center">
    <div className="flex items-start w-full justify-between m-5 p-5">
        <div className="flex-col">
        <div className="flex items-start mb-5">
            <span className="font-inter text-logo-purple text-6xl font-bold">Peer</span>
            <span className="font-inter text-logo-green text-6xl font-bold">Prep</span>
        </div>
        <p className="font-poppins text-text-main text-5xl font-bold">
        {userName}'s Attempt History
        </p>
        </div>
        <div className="flex items-end"> 
        <button className="bg-blue-button text-white p-4 rounded-3xl font-poppins text-2xl hover:bg-blue-button-hover"
            onClick={() => { router.push('/dashboard')}}>
            Back to Dashboard
        </button>
        </div>
    </div>



        <div className="w-full max-w-9xl mx-auto p-6 flex flex-col gap-4">
            {questionAttempts.map((attempt) => (
                <AttemptItem 
                    key={attempt.attemptId}
                    attemptId={attempt.attemptId}
                    completionStatus={attempt.completedStatus}
                    dateString={formatDateString(attempt.connectedAtTime)}
                    questionTitle={extractQuestionTitle(attempt.qnData)}
                    otherUserName={getOtherUserName(attempt)}
                />
            ))}
        </div>
    </div>
        );
}
        
