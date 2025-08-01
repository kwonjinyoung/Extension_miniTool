// 백그라운드 서비스 워커
import { bookmarklets } from './bookmarklets.js';

// 익스텐션 아이콘 클릭 시 사이드 패널 열기
chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ tabId: tab.id });
});

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'executeBookmarklet') {
        executeBookmarklet(request.tabId, request.bookmarkletName, request.params)
            .then(result => sendResponse({ success: true, data: result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // 비동기 응답을 위해 true 반환
    }
});

// 북마크릿 실행 함수
async function executeBookmarklet(tabId, bookmarkletName, params) {
    const bookmarklet = bookmarklets[bookmarkletName];
    
    if (!bookmarklet) {
        throw new Error(`북마크릿을 찾을 수 없습니다: ${bookmarkletName}`);
    }
    
    try {
        // 스크립트 실행
        const result = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: bookmarklet.func,
            args: params ? [params] : []
        });
        
        return result[0]?.result;
    } catch (error) {
        console.error('스크립트 실행 오류:', error);
        throw error;
    }
}

// 설치 시 초기 설정
chrome.runtime.onInstalled.addListener(() => {
    console.log('미니 도구 모음 익스텐션이 설치되었습니다.');
    
    // 사이드 패널 기본 동작 설정
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});