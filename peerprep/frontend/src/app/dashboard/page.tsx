"use client";
import UserWidget from "./widgets/userWidget"
import MatchingWidget from "./widgets/matchingWidget"
import QuestionHistoryWidget from "./widgets/questionHistWidget"
import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSocket, initSocket } from "../socket/socket";

const ATTEMPT_HISTORY_API_URL = `${process.env.NEXT_PUBLIC_ATTEMPT_HISTORY_SERVICE_API_URL}/attempts` || "http://localhost:3004/attempts";

export default function DashboardPage() {
  const router = useRouter()
  const[user, setUser] = useState<any>(null)
  const[token,setToken] = useState<string>("")
  const[userName, setUserName] =  useState<string>("")
  const[userId, setUserId] = useState<any>(null)
  const[totalAttempts, setTotalAttempts] = useState<string>("")
  const[successfulAttempts, setSuccessfulAttempts] = useState<string>("")

 // Make sure user is logged in + get userId and also userName
  useEffect(() => {
        const user = sessionStorage.getItem("user");
        const token = sessionStorage.getItem("token");
        if (!user || !token) {
            router.push("/");
            console.error("You must be logged in to access this page.");
        } else {
            const parsedUser = JSON.parse(user);
            setUser(parsedUser);
            setToken(token);
            if (!parsedUser.id || !parsedUser.username ) {
                router.push("/");
                console.error("Invalid user data in session storage:", parsedUser);
            } else {
                setUserName(parsedUser.username);
                setUserId(parsedUser.id);
            }
        }
        initSocket();
        const socket = getSocket();
        socket?.disconnect()
    }, [])

    // retrieve the attempt history service analyitics data when userId is set
    const getAttemptHistorySummary = async (id: string) => {
      const url = `${ATTEMPT_HISTORY_API_URL}/summary/${id}`;
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          console.log("Failed to fetch attempt history summary data:", response.statusText);
            setTotalAttempts('0');
            setSuccessfulAttempts('0');
        return;
        }
        const data = await response.json();
        console.log("Attempt history summary data:", data);
        setTotalAttempts(data.totalAttempted.toString());
        setSuccessfulAttempts(data.totalSolved.toString());
      } catch (error) {
        console.error("Error fetching attempt history summary data:", error);
        return;
      }
    };

    useEffect(() => {
      if (userId === null) return;
      console.log(userId.toString());
      getAttemptHistorySummary(userId.toString());
    }, [userId]);

  return (
    <div className="bg-dark-blue-bg h-screen w-screen flex flex-col pt-7 pl-12 pr-12 overflow-hidden">

      <div className="flex items-start justify-between">
        <div className="flex-col">
          <div className="flex items-start mb-5">
            <span className="font-inter text-logo-purple text-6xl font-bold">Peer</span>
            <span className="font-inter text-logo-green text-6xl font-bold">Prep</span>
          </div>
          <p className="font-poppins text-text-main text-4xl font-bold">
            Welcome back, {userName}!
          </p>
        </div>
        <div className="flex items-end"> 
          <UserWidget 
            userName={userName}
          />
        </div>
      </div>

      <div className="flex-col m-5">
        <div className="bg-dark-box h-1.5 rounded-2xl mb-3"></div>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col">
            <p className="text-text-main font-poppins text-3xl p-3">Dive into a problem
            </p>
            <MatchingWidget/>
          </div>
          <div>
            <p className="text-text-main font-poppins text-3xl p-3">Question History
            </p>
            <QuestionHistoryWidget
              totalAttempts={totalAttempts}
              successfulAttempts={successfulAttempts}
            />
          </div>
        </div>
      </div> 
    </div>
  )
}