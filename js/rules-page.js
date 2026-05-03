import { initShell, showError } from "./router.js";

try {
  initShell("rules", "기본규칙");
} catch (error) {
  console.error(error);
  showError("페이지를 초기화하지 못했습니다.");
}
