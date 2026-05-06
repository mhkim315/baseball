import { showError } from "./router.js";
import { renderBottomTab } from "./bottom-tab.js";

try {
  renderBottomTab("cheering");
  document.title = "fullcount.kr · 기본규칙";
} catch (error) {
  console.error(error);
  showError("페이지를 초기화하지 못했습니다.");
}
