// 도구 버튼 클릭 이벤트 리스너
document.addEventListener('DOMContentLoaded', function() {
    // 모든 도구 버튼에 이벤트 리스너 추가
    const toolButtons = document.querySelectorAll('.tool-btn');
    toolButtons.forEach(button => {
        button.addEventListener('click', handleToolClick);
    });

    // 검색 기능
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', handleSearch);

    // 모달 닫기 버튼
    const closeBtn = document.querySelector('.close');
    const modal = document.getElementById('modal');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});

// 도구 클릭 핸들러
async function handleToolClick(event) {
    const button = event.currentTarget;
    const toolName = button.getAttribute('data-tool');
    
    // 현재 활성 탭 가져오기
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    switch(toolName) {
        case 'show-images-only':
            executeBookmarklet(tab.id, 'showImagesOnly');
            break;
        case 'download-all-images':
            executeBookmarklet(tab.id, 'downloadAllImages');
            break;
        case 'extract-image-urls':
            executeBookmarklet(tab.id, 'extractImageUrls');
            break;
        case 'regex-search':
            showRegexSearchModal();
            break;
        case 'extract-all-links':
            executeBookmarklet(tab.id, 'extractAllLinks');
            break;
        case 'copy-all-text':
            executeBookmarklet(tab.id, 'copyAllText');
            break;
        case 'remove-ads':
            executeBookmarklet(tab.id, 'removeAds');
            break;
        case 'print-friendly':
            executeBookmarklet(tab.id, 'printFriendly');
            break;
        case 'dark-mode':
            executeBookmarklet(tab.id, 'darkMode');
            break;
        case 'show-cookies':
            executeBookmarklet(tab.id, 'showCookies');
            break;
        case 'view-source':
            executeBookmarklet(tab.id, 'viewSource');
            break;
        case 'console-log':
            executeBookmarklet(tab.id, 'consoleLog');
            break;
    }
}

// 북마크릿 실행 함수
async function executeBookmarklet(tabId, bookmarkletName) {
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'executeBookmarklet',
            tabId: tabId,
            bookmarkletName: bookmarkletName
        });
        
        if (response && response.success) {
            console.log('북마크릿 실행 성공:', response);
            if (response.data) {
                // 결과 데이터가 있으면 모달에 표시
                showResultModal(bookmarkletName, response.data);
            }
            if (response.message) {
                // 성공 메시지 표시
                alert(response.message);
            }
        } else {
            console.error('북마크릿 실행 실패:', response?.error);
            alert('실행 실패: ' + (response?.error || '알 수 없는 오류'));
        }
    } catch (error) {
        console.error('북마크릿 실행 중 오류:', error);
    }
}

// 검색 기능
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const toolButtons = document.querySelectorAll('.tool-btn');
    const categories = document.querySelectorAll('.tool-category');
    
    toolButtons.forEach(button => {
        const toolName = button.querySelector('.tool-name').textContent.toLowerCase();
        const toolDesc = button.querySelector('.tool-desc').textContent.toLowerCase();
        
        if (toolName.includes(searchTerm) || toolDesc.includes(searchTerm)) {
            button.classList.remove('hidden');
        } else {
            button.classList.add('hidden');
        }
    });
    
    // 빈 카테고리 숨기기
    categories.forEach(category => {
        const visibleButtons = category.querySelectorAll('.tool-btn:not(.hidden)');
        if (visibleButtons.length === 0) {
            category.classList.add('empty');
        } else {
            category.classList.remove('empty');
        }
    });
}

// 정규식 검색 모달 표시
function showRegexSearchModal() {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = '정규식 검색';
    modalBody.innerHTML = `
        <label for="regexInput">정규식 패턴:</label>
        <input type="text" id="regexInput" placeholder="예: \\d{3}-\\d{4}-\\d{4}">
        <label for="flagsInput">플래그 (선택):</label>
        <input type="text" id="flagsInput" placeholder="예: gi">
        <button id="searchButton">검색</button>
    `;
    
    modal.style.display = 'block';
    
    document.getElementById('searchButton').addEventListener('click', async () => {
        const pattern = document.getElementById('regexInput').value;
        const flags = document.getElementById('flagsInput').value || 'gi';
        
        if (pattern) {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            executeBookmarklet(tab.id, 'regexSearch', { pattern, flags });
            modal.style.display = 'none';
        }
    });
}

// 결과 모달 표시
function showResultModal(title, data) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = getModalTitle(title);
    modalBody.innerHTML = formatResultData(title, data);
    
    modal.style.display = 'block';
}

// 모달 제목 가져오기
function getModalTitle(bookmarkletName) {
    const titles = {
        'extractImageUrls': '이미지 URL 목록',
        'extractAllLinks': '링크 목록',
        'showCookies': '쿠키 정보',
        'regexSearch': '정규식 검색 결과'
    };
    
    return titles[bookmarkletName] || '결과';
}

// 결과 데이터 포맷팅
function formatResultData(bookmarkletName, data) {
    if (Array.isArray(data)) {
        return `
            <div style="max-height: 400px; overflow-y: auto;">
                ${data.map(item => `<div style="margin: 5px 0; padding: 5px; background: #f5f5f5; border-radius: 4px; word-break: break-all;">${item}</div>`).join('')}
            </div>
            <div style="margin-top: 10px; color: #666;">총 ${data.length}개 항목</div>
        `;
    } else if (typeof data === 'object') {
        return `
            <div style="max-height: 400px; overflow-y: auto;">
                ${Object.entries(data).map(([key, value]) => `
                    <div style="margin: 5px 0;">
                        <strong>${key}:</strong> ${value}
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        return `<div>${data}</div>`;
    }
}