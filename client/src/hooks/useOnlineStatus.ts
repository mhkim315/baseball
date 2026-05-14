import { useEffect, useState } from "react";
import { toast } from "sonner";

export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      toast.success("다시 온라인 상태가 되었어요");
    };
    const goOffline = () => {
      setOnline(false);
      toast.warning("오프라인 상태입니다", {
        description: "최근에 불러온 데이터만 표시돼요",
      });
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
}
