"use client";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import "../globals.css";
import Image from "next/image";
import { getCookie } from "..";
import { getCurrentSessions, editWritingSetUp } from "@/api/api";
import Dropdown from "@/components/Dropdown";
import { SettingData } from "../../../interface";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50">
      <div
        className="absolute w-full h-full bg-gray-800 opacity-50"
        onClick={onClose}
      ></div>
      <div className="relative flex flex-col bg-white w-[800px] h-[550px] rounded-lg z-50">
        <div className="p-8">
          <div className="text-[16px]">4번째 글</div>
          <div className="mb-[10px] text-[22px]">뮤직비디오 해석하기</div>
          <textarea
            className="text-[40px] w-full mb-[30px] h-[50px]"
            placeholder="제목을 입력해주세요."
          />
          <hr
            className="w-full bg-[#7C766C] h-[1px] lg:my-0 my-[17px]"
            style={{ color: "#7C766C", borderColor: "#7C766C" }}
          />
          <textarea
            className="mt-[30px] w-full h-[220px] overflow-y-auto"
            placeholder="내용을 입력해주세요."
          />
        </div>
        <div className="flex flex-col w-full rounded-md">
          <div
            className="h-[100px] flex justify-between  p-8 items-center rounded-md w-full"
            style={{ backgroundColor: "#F1F1F1" }}
          >
            <a className="items-start justify-start flex">남은 시간 01:03:55</a>
            <button
              className="w-[152px] h-[53px] rounded-md"
              style={{ backgroundColor: "#979797" }}
              onClick={onClose}
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ChangeSettings() {
  const router = useRouter();
  const accessToken = getCookie("access_token");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSessionInfo, setCurrentSessionInfo] = useState<any>({});
  const [writingTime, setWritingTime] = useState(
    parseInt(currentSessionInfo?.data?.startAt?.hour) < 12 ? "AM" : "PM"
  );
  const [editCount, setEditCount] = useState(0);
  const [changedData, setChangedData] = useState<SettingData>({
    // 초기 상태 설정
    page: 0,
    period: 0,
    startAt: { hour: 0, minute: 0 },
    subject: "",
    writingHours: 0,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentSessionInfo = await getCurrentSessions(accessToken);
        console.log("현재 글쓰기 데이터 정보: ", currentSessionInfo);
        setCurrentSessionInfo(currentSessionInfo);
        setChangedData({
          page: currentSessionInfo?.data?.page,
          period: currentSessionInfo?.data?.period,
          startAt: { hour: 0, minute: 0 },
          subject: currentSessionInfo?.data?.subject,
          writingHours: 0,
        });

        setWritingTime(
          parseInt(currentSessionInfo?.data?.startAt?.hour) < 12 ? "AM" : "PM"
        );
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const changeSessionSettings = async () => {
    console.log("바꿀 설정 정보: ", changedData);
    try {
      const changeOptions = await editWritingSetUp(
        currentSessionInfo?.data?.id,
        changedData,
        accessToken
      );
      console.log("변경 옵션:", changeOptions);
      setEditCount(editCount + 1);
    } catch (error) {
      console.error("Error - change session setting :", error);
    }
  };

  return (
    <div className="flex flex-col my-[50px] w-full">
      <style>{`body { background: #F2EBDD; margin: 0; height: 100%; }`}</style>
      <div className="flex flex-row mx-auto w-full">
        <div className="flex flex-col w-full mx-[120px]">
          <div className="flex flex-row justify-between">
            <Image
              className="lg:mb-[20px] mb-0 w-[74px] lg:w-[105px] h-[24px] lg:h-[35px]"
              src="https://gloo-image-bucket.s3.amazonaws.com/archive/logo.svg"
              width="105"
              height="35"
              alt="Logo"
            />
            <div className="flex gap-x-[70px]">
              <a
                className="cursor-pointer"
                style={{ color: "#A49E90" }}
                onClick={() =>
                  router.push({
                    pathname: "/glooing",
                    query: { access_token: accessToken },
                  })
                }
              >
                글루ING
              </a>
              <a
                className="cursor-pointer font-bold"
                style={{ color: "#191919" }}
                onClick={() => router.push("/mypage/badgeList")}
              >
                나의 보관함
              </a>
              <a
                className="cursor-pointer"
                style={{ color: "#A49E90" }}
                onClick={() => router.push("/")}
              >
                로그아웃
              </a>
            </div>
          </div>
          <hr
            className="w-full bg-[#7C766C] h-[1px] lg:my-0 sm:my-[17px]"
            style={{ color: "#7C766C", borderColor: "#7C766C" }}
          />
          <div className="flex mt-[20px] justify-between flex-row my-[30px]">
            <div className="bg-black rounded-sm  flex flex-col w-[400px] h-[471px]">
              <div className="flex flex-col mx-[20px]">
                <div className="text-white mt-[34px] w-full h-[51px] text-[36px]">
                  나의 보관함
                </div>
                <div className="flex flex-col gap-y-[26px] mt-[24px]">
                  <div
                    className="flex text-[20px] cursor-pointer"
                    style={{ color: "#CEB292" }}
                    onClick={() => router.push("/mypage/badgeList")}
                  >
                    나의 뱃지
                  </div>
                  <div
                    className="flex text-[20px] cursor-pointer"
                    style={{ color: "#CEB292" }}
                    onClick={() => router.push("/mypage/mybook")}
                  >
                    내가 발행한 책
                  </div>
                  <div
                    className="flex text-[20px] cursor-pointer"
                    style={{ color: "#CEB292" }}
                    onClick={() => router.push("/mypage/unfinished")}
                  >
                    못다쓴 책
                  </div>

                  <div
                    className="flex text-[20px] font-bold cursor-pointer"
                    style={{ color: "#CEB292" }}
                    onClick={() => router.push("/mypage/change-settings")}
                  >
                    설정
                  </div>
                </div>
              </div>
            </div>
            <div className="w-[1120px] rounded-sm  flex flex-row h-[759px]">
              <div className="w-full ml-2 ">
                <div className="flex flex-row items-center ">
                  <div className="w-[205px] text-black mt-[8px] text-[32px] font-bold">
                    설정
                  </div>
                </div>
                <div className="flex text-[20px] cursor-pointer mt-[20px]">
                  글쓰기 시간을 변경할 수 있어요. (0/2)
                </div>
                <div
                  className="flex text-[14px] cursor-pointer mt-[8px]"
                  style={{ color: "#918A7C" }}
                >
                  *주 최대 2회 변경 가능합니다. <br />
                </div>
                <div className="w-[250px] mt-[30px] flex flex-row gap-x-[14px]">
                  <button
                    className={`w-[60px] h-[30px] border-1 rounded-md ${
                      writingTime === "AM" ? "bg-black text-white" : " bg-white"
                    }`}
                    style={{ border: "1px solid gray" }}
                    onClick={() => setWritingTime("AM")}
                  >
                    AM
                  </button>
                  <button
                    className={`w-[60px] h-[30px] border-1 rounded-md ${
                      writingTime === "PM" ? "bg-black text-white" : " bg-white"
                    }`}
                    style={{ border: "1px solid gray" }}
                    onClick={() => setWritingTime("PM")}
                  >
                    PM
                  </button>
                </div>
                <div className="flex flex-col mt-[20px] lg:flex-row gap-y-4 lg:gap-x-4">
                  <div className="flex flex-row gap-x-[20px]">
                    <Dropdown
                      items={[
                        { name: "1시", value: 1 },
                        { name: "2시", value: 2 },
                        { name: "3시", value: 3 },
                        { name: "4시", value: 4 },
                        { name: "5시", value: 5 },
                        { name: "6시", value: 6 },
                        { name: "7시", value: 7 },
                        { name: "8시", value: 8 },
                        { name: "9시", value: 9 },
                        { name: "10시", value: 10 },
                        { name: "11시", value: 11 },
                        { name: "12시", value: 12 },
                      ]}
                      onSelect={(selectedHour) => {
                        const newHour =
                          writingTime === "PM" && selectedHour.value !== 12
                            ? selectedHour.value + 12
                            : writingTime === "AM" && selectedHour.value === 12
                            ? 0
                            : selectedHour.value;

                        setChangedData((prevData) => ({
                          ...prevData,
                          startAt: {
                            ...prevData.startAt,
                            hour: newHour,
                          },
                        }));
                      }}
                    />

                    <Dropdown
                      items={[
                        { name: "00분", value: 0 },
                        { name: "15분", value: 15 },
                        { name: "30분", value: 30 },
                        { name: "45분", value: 45 },
                      ]}
                      onSelect={(selectedMinute) => {
                        setChangedData((prevData) => ({
                          ...prevData,
                          startAt: {
                            ...prevData.startAt,
                            minute: selectedMinute.value,
                          },
                        }));
                      }}
                    />
                    <a className="my-auto">부터</a>
                  </div>
                  <div className="flex flex-row gap-x-4">
                    <button className="w-[82px] h-[40px] border-1 border-black rounded-md bg-white">
                      <Dropdown
                        items={[
                          { name: "1시간", value: 1 },
                          { name: "2시간", value: 2 },
                          { name: "3시간", value: 3 },
                          { name: "4시간", value: 4 },
                          { name: "5시간", value: 5 },
                        ]}
                        onSelect={(selectedForHours) => {
                          setChangedData((prevData) => ({
                            ...prevData,
                            writingHours: selectedForHours.value,
                          }));
                        }}
                      />
                    </button>
                    <a className="ml-[20px] my-auto">동안</a>
                  </div>
                </div>
                <button
                  className="rounded-md mx-auto mt-[20px] w-[115px] h-[30px] text-[15px] bg-black text-white"
                  onClick={changeSessionSettings}
                >
                  변경하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
}
