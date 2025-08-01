// 북마크릿 함수 모음
export const bookmarklets = {
    // 이미지만 보기
    showImagesOnly: {
        func: function() {
            const images = document.querySelectorAll('img');
            const imageUrls = Array.from(images).map(img => img.src).filter(src => src);
            
            // 새 창에 표시할 HTML 생성
            const html = `
<!DOCTYPE html>
<html>
<head>
    <title>이미지 보기 - ${document.title}</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background-color: #f0f0f0;
            font-family: Arial, sans-serif;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .header h1 {
            margin: 0 0 10px 0;
            color: #333;
        }
        .header p {
            margin: 0;
            color: #666;
        }
        .container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
        }
        .img-wrapper {
            background-color: white;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        .img-wrapper:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        }
        .img-wrapper img {
            width: 100%;
            height: auto;
            cursor: pointer;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>이미지 갤러리</h1>
        <p>원본 페이지: ${window.location.href}</p>
        <p>총 ${imageUrls.length}개의 이미지</p>
    </div>
    <div class="container">
        ${imageUrls.map(url => `
            <div class="img-wrapper">
                <img src="${url}" onclick="window.open('${url}')" alt="이미지">
            </div>
        `).join('')}
    </div>
</body>
</html>`;
            
            // 새 탭 열기
            const newWindow = window.open('', '_blank');
            newWindow.document.write(html);
            newWindow.document.close();
        }
    },
    
    // 모든 이미지 다운로드
    downloadAllImages: {
        func: function() {
            const images = document.querySelectorAll('img');
            const imageUrls = Array.from(images)
                .map(img => img.src)
                .filter(src => src && src.startsWith('http'));
            
            if (!imageUrls.length) {
                alert('다운로드 가능한 이미지가 없습니다.');
                return;
            }
            
            // 이미지 URL들을 반환하여 background.js에서 처리
            return { action: 'downloadImages', urls: imageUrls };
        }
    },
    
    // 이미지 URL 추출
    extractImageUrls: {
        func: function() {
            const images = document.querySelectorAll('img');
            const imageUrls = Array.from(images).map(img => img.src).filter(src => src);
            return imageUrls;
        }
    },
    
    // 정규식 검색
    regexSearch: {
        func: function(params) {
            const { pattern, flags } = params;
            const regex = new RegExp(pattern, flags);
            const textContent = document.body.innerText;
            const matches = textContent.match(regex) || [];
            
            // 페이지에서 매치 하이라이트
            if (matches.length > 0) {
                const uniqueMatches = [...new Set(matches)];
                uniqueMatches.forEach(match => {
                    const escapedMatch = match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    document.body.innerHTML = document.body.innerHTML.replace(
                        new RegExp(escapedMatch, 'g'),
                        `<mark style="background-color: yellow; padding: 2px;">${match}</mark>`
                    );
                });
            }
            
            return matches;
        }
    },
    
    // 모든 링크 추출
    extractAllLinks: {
        func: function() {
            const links = document.querySelectorAll('a[href]');
            const linkUrls = Array.from(links).map(link => link.href).filter(href => href);
            return [...new Set(linkUrls)]; // 중복 제거
        }
    },
    
    // 모든 텍스트 복사
    copyAllText: {
        func: function() {
            const textContent = document.body.innerText;
            navigator.clipboard.writeText(textContent).then(() => {
                alert('페이지의 모든 텍스트가 클립보드에 복사되었습니다.');
            }).catch(err => {
                alert('텍스트 복사 실패: ' + err.message);
            });
        }
    },
    
    // 광고 제거
    removeAds: {
        func: function() {
            const adSelectors = [
                'iframe',
                '[class*="ad-"]',
                '[class*="ads-"]',
                '[class*="advertisement"]',
                '[id*="ad-"]',
                '[id*="ads-"]',
                '[id*="advertisement"]',
                '.ad',
                '.ads',
                '.advertisement',
                '.banner',
                '.popup',
                '.modal-overlay'
            ];
            
            let removedCount = 0;
            adSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    el.remove();
                    removedCount++;
                });
            });
            
            alert(`${removedCount}개의 광고 요소를 제거했습니다.`);
        }
    },
    
    // 인쇄 친화적 보기
    printFriendly: {
        func: function() {
            // 불필요한 요소 제거
            const unnecessarySelectors = [
                'nav',
                'header',
                'footer',
                'aside',
                '.sidebar',
                '.navigation',
                '.menu',
                '.comments',
                '.social-share',
                'iframe',
                'video',
                '.advertisement'
            ];
            
            unnecessarySelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => el.style.display = 'none');
            });
            
            // 메인 콘텐츠 스타일 조정
            document.body.style.backgroundColor = 'white';
            document.body.style.color = 'black';
            document.body.style.fontFamily = 'Georgia, serif';
            document.body.style.fontSize = '16px';
            document.body.style.lineHeight = '1.6';
            document.body.style.maxWidth = '800px';
            document.body.style.margin = '0 auto';
            document.body.style.padding = '40px 20px';
            
            // 링크 스타일
            const links = document.querySelectorAll('a');
            links.forEach(link => {
                link.style.color = '#0066cc';
                link.style.textDecoration = 'underline';
            });
            
            alert('인쇄 친화적 보기로 전환되었습니다.');
        }
    },
    
    // 다크 모드
    darkMode: {
        func: function() {
            const darkModeCSS = `
                * {
                    background-color: #1a1a1a !important;
                    color: #e0e0e0 !important;
                    border-color: #333 !important;
                }
                a {
                    color: #6db3f2 !important;
                }
                img {
                    opacity: 0.8 !important;
                }
                input, textarea, select {
                    background-color: #2a2a2a !important;
                    color: #e0e0e0 !important;
                }
                code, pre {
                    background-color: #2a2a2a !important;
                    color: #e0e0e0 !important;
                }
            `;
            
            const style = document.createElement('style');
            style.textContent = darkModeCSS;
            style.id = 'dark-mode-style';
            
            const existingStyle = document.getElementById('dark-mode-style');
            if (existingStyle) {
                existingStyle.remove();
                alert('다크 모드가 해제되었습니다.');
            } else {
                document.head.appendChild(style);
                alert('다크 모드가 적용되었습니다.');
            }
        }
    },
    
    // 쿠키 보기
    showCookies: {
        func: function() {
            const cookies = document.cookie.split(';').map(c => c.trim());
            const cookieData = {};
            
            cookies.forEach(cookie => {
                const [name, value] = cookie.split('=');
                if (name) {
                    cookieData[name] = value || '';
                }
            });
            
            return cookieData;
        }
    },
    
    // 소스 보기
    viewSource: {
        func: function() {
            const sourceWindow = window.open('', '_blank');
            const escapedHtml = document.documentElement.outerHTML
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            
            sourceWindow.document.write(`
                <html>
                <head>
                    <title>페이지 소스</title>
                    <style>
                        body {
                            font-family: monospace;
                            white-space: pre-wrap;
                            background: #f5f5f5;
                            padding: 20px;
                        }
                    </style>
                </head>
                <body>${escapedHtml}</body>
                </html>
            `);
        }
    },
    
    // 콘솔 로그
    consoleLog: {
        func: function() {
            console.group('페이지 정보');
            console.log('URL:', window.location.href);
            console.log('제목:', document.title);
            console.log('문서 크기:', document.documentElement.scrollHeight + 'px');
            console.log('이미지 수:', document.images.length);
            console.log('링크 수:', document.links.length);
            console.log('스크립트 수:', document.scripts.length);
            console.log('스타일시트 수:', document.styleSheets.length);
            console.groupEnd();
            
            alert('페이지 정보가 개발자 콘솔에 출력되었습니다. F12를 눌러 확인하세요.');
        }
    }
};