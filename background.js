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
        
        const scriptResult = result[0]?.result;
        console.log('스크립트 실행 결과:', scriptResult);
        
        // 이미지 ZIP 다운로드 처리
        if (scriptResult?.action === 'downloadImagesAsZip') {
            console.log('이미지 ZIP 다운로드 처리 시작');
            await downloadImagesAsZip(scriptResult.images);
            return { success: true, message: '이미지 다운로드를 시작했습니다.' };
        }
        
        // ZIP 다운로드 특별 처리
        if (scriptResult?.action === 'downloadZip') {
            console.log('ZIP 다운로드 처리 시작');
            const base64Data = scriptResult.base64Data.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/zip' });
            
            // data URL 생성 (Service Worker에서는 createObjectURL 사용 불가)
            const dataUrl = `data:application/zip;base64,${base64Data}`;
            
            // 다운로드
            try {
                const downloadId = await chrome.downloads.download({
                    url: dataUrl,
                    filename: scriptResult.filename,
                    conflictAction: 'uniquify'
                });
                console.log('다운로드 시작됨, ID:', downloadId);
                return { success: true, message: scriptResult.message };
            } catch (downloadError) {
                console.error('다운로드 오류:', downloadError);
                throw downloadError;
            }
        }
        
        return scriptResult;
    } catch (error) {
        console.error('스크립트 실행 오류:', error);
        throw error;
    }
}


// 이미지를 ZIP으로 다운로드하는 함수
async function downloadImagesAsZip(images) {
    console.log(`이미지 ${images.length}개를 ZIP으로 다운로드 시작`);
    
    try {
        // 현재 탭 가져오기
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // JSZip 라이브러리 주입
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['jszip.min.js']
        });
        
        // 이미지 다운로드 및 ZIP 생성 스크립트 실행
        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: async (imageList) => {
                const zip = new JSZip();
                let successCount = 0;
                let failCount = 0;
                
                // 상태 표시 UI 생성
                const status = document.createElement('div');
                status.style.cssText = 'position:fixed;top:10px;right:10px;background:#333;color:#fff;padding:10px;border-radius:5px;z-index:9999;font-family:sans-serif;';
                status.textContent = '이미지 다운로드 준비 중...';
                document.body.appendChild(status);
                
                // 각 이미지 다운로드
                for (let i = 0; i < imageList.length; i++) {
                    const img = imageList[i];
                    status.textContent = `이미지 다운로드 중... ${i + 1}/${imageList.length}`;
                    
                    try {
                        const response = await fetch(img.url);
                        if (response.ok) {
                            const blob = await response.blob();
                            const extension = blob.type.split('/')[1] || 'jpg';
                            const filename = `image_${i + 1}.${extension}`;
                            zip.file(filename, blob);
                            successCount++;
                        } else {
                            failCount++;
                        }
                    } catch (error) {
                        console.error(`이미지 다운로드 실패: ${img.url}`);
                        failCount++;
                    }
                }
                
                if (successCount === 0) {
                    status.textContent = '다운로드 가능한 이미지가 없습니다!';
                    setTimeout(() => document.body.removeChild(status), 3000);
                    return null;
                }
                
                status.textContent = `ZIP 파일 생성 중... (성공: ${successCount}, 실패: ${failCount})`;
                
                // ZIP 파일 생성
                const content = await zip.generateAsync({ type: 'blob' });
                const reader = new FileReader();
                const base64 = await new Promise((resolve) => {
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(content);
                });
                
                status.textContent = `다운로드 준비 완료! (성공: ${successCount}개)`;
                setTimeout(() => document.body.removeChild(status), 3000);
                
                return {
                    base64: base64,
                    successCount: successCount,
                    failCount: failCount
                };
            },
            args: [images]
        });
        
        if (result[0]?.result && result[0].result.base64) {
            const data = result[0].result;
            const base64Data = data.base64.split(',')[1];
            
            // data URL로 다운로드
            const downloadUrl = `data:application/zip;base64,${base64Data}`;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            
            await chrome.downloads.download({
                url: downloadUrl,
                filename: `images_${timestamp}.zip`,
                conflictAction: 'uniquify'
            });
            
            console.log(`ZIP 다운로드 완료: 성공 ${data.successCount}개, 실패 ${data.failCount}개`);
        }
    } catch (error) {
        console.error('이미지 ZIP 다운로드 중 오류:', error);
        throw error;
    }
}

// 설치 시 초기 설정
chrome.runtime.onInstalled.addListener(() => {
    console.log('미니 도구 모음 익스텐션이 설치되었습니다.');
    
    // 사이드 패널 기본 동작 설정
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});