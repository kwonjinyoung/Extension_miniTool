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
    
    // 모든 이미지 다운로드 (간단한 버전)
    downloadAllImages: {
        func: function() {
            // 모든 이미지 URL 수집
            const images = [];
            const urls = new Set();
            
            // img 태그에서 수집
            document.querySelectorAll('img').forEach(img => {
                if (img.src && img.src.startsWith('http') && !urls.has(img.src)) {
                    urls.add(img.src);
                    images.push({
                        url: img.src,
                        type: 'img'
                    });
                }
            });
            
            // background-image에서 수집 (선택사항)
            document.querySelectorAll('*').forEach(el => {
                try {
                    const bg = getComputedStyle(el).backgroundImage;
                    if (bg && bg !== 'none') {
                        const matches = bg.match(/url\(['"]?([^'"]+)['"]?\)/g);
                        if (matches) {
                            matches.forEach(m => {
                                const url = m.replace(/url\(['"]?([^'"]+)['"]?\)/, '$1');
                                if (url && url.startsWith('http') && !urls.has(url)) {
                                    urls.add(url);
                                    images.push({
                                        url: url,
                                        type: 'background'
                                    });
                                }
                            });
                        }
                    }
                } catch (e) {}
            });
            
            console.log(`수집된 이미지 URL 수: ${images.length}`);
            
            if (images.length === 0) {
                alert('이미지를 찾을 수 없습니다.');
                return null;
            }
            
            // 상태 표시
            const status = document.createElement('div');
            status.style.cssText = 'position:fixed;top:10px;right:10px;background:#333;color:#fff;padding:10px;border-radius:5px;z-index:9999;font-family:sans-serif;';
            status.textContent = `${images.length}개 이미지 발견. 다운로드 준비 중...`;
            document.body.appendChild(status);
            
            setTimeout(() => document.body.removeChild(status), 3000);
            
            // background script에서 처리하도록 URL 목록 반환
            return {
                action: 'downloadImagesAsZip',
                images: images
            };
        }
    },
    
    // 모든 이미지 다운로드 (복잡한 버전 - 백업용)
    downloadAllImagesComplex: {
        func: async function() {
            // JSZip 로드 확인 및 로딩
            if (!window.JSZip) {
                const script = document.createElement('script');
                script.src = chrome.runtime.getURL('jszip.min.js');
                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            // 모든 이미지 수집 (iframe, background-image 포함)
            function getAllImages() {
                const images = [];
                const urls = new Set();

                function collect(doc) {
                    try {
                        // img 태그 수집
                        Array.from(doc.getElementsByTagName('img')).forEach(img => {
                            if (img.src && !urls.has(img.src)) {
                                images.push(img);
                                urls.add(img.src);
                            }
                        });

                        // background-image 수집
                        Array.from(doc.getElementsByTagName('*')).forEach(el => {
                            try {
                                const bg = getComputedStyle(el).backgroundImage;
                                if (bg && bg !== 'none') {
                                    const matches = bg.match(/url\(['"]?([^'"]+)['"]?\)/g);
                                    if (matches) {
                                        matches.forEach(m => {
                                            const url = m.replace(/url\(['"]?([^'"]+)['"]?\)/, '$1');
                                            if (url && !urls.has(url)) {
                                                const vImg = document.createElement('img');
                                                vImg.src = url;
                                                images.push(vImg);
                                                urls.add(url);
                                            }
                                        });
                                    }
                                }
                            } catch (e) {}
                        });

                        // iframe 내부 탐색
                        if (doc === document) {
                            Array.from(doc.getElementsByTagName('iframe')).forEach(iframe => {
                                try {
                                    if (iframe.contentDocument) {
                                        collect(iframe.contentDocument);
                                    }
                                } catch (e) {}
                            });
                        }
                    } catch (e) {}
                }

                collect(document);
                console.log(`총 ${images.length}개 이미지 발견`);
                return images;
            }

            // 이미지 다운로드 함수
            async function downloadImg(img, i) {
                let src = img.src;
                if (src && !src.startsWith('http') && !src.startsWith('data:')) {
                    src = new URL(src, location.href).href;
                }
                
                if (!src || src.startsWith('data:image/svg') || src.length < 10) {
                    console.log(`이미지 ${i+1} 스킵: 유효하지 않은 URL`);
                    return null;
                }

                try {
                    let blob;
                    
                    // 여러 방법으로 이미지 다운로드 시도
                    try {
                        console.log(`이미지 ${i+1} CORS 모드로 시도: ${src}`);
                        const res = await fetch(src, { mode: 'cors' });
                        if (res.ok) {
                            blob = await res.blob();
                            console.log(`이미지 ${i+1} CORS 성공`);
                        } else {
                            throw new Error('CORS 실패');
                        }
                    } catch (e1) {
                        try {
                            console.log(`이미지 ${i+1} no-cors 모드로 시도`);
                            const res = await fetch(src, { mode: 'no-cors' });
                            blob = await res.blob();
                            // no-cors의 경우 blob이 opaque일 수 있음
                            if (blob.size === 0) {
                                throw new Error('no-cors opaque response');
                            }
                            console.log(`이미지 ${i+1} no-cors 성공`);
                        } catch (e2) {
                            // Canvas를 사용한 이미지 다운로드
                            console.log(`이미지 ${i+1} Canvas 방법으로 시도`);
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            const tempImg = new Image();
                            tempImg.crossOrigin = 'anonymous';
                            
                            await new Promise((resolve, reject) => {
                                const timeout = setTimeout(() => {
                                    reject(new Error('이미지 로드 타임아웃'));
                                }, 5000);
                                
                                tempImg.onload = () => {
                                    clearTimeout(timeout);
                                    canvas.width = tempImg.naturalWidth || tempImg.width;
                                    canvas.height = tempImg.naturalHeight || tempImg.height;
                                    ctx.drawImage(tempImg, 0, 0);
                                    canvas.toBlob(b => {
                                        if (b) {
                                            blob = b;
                                            console.log(`이미지 ${i+1} Canvas 성공`);
                                            resolve();
                                        } else {
                                            reject(new Error('Canvas toBlob 실패'));
                                        }
                                    }, 'image/png');
                                };
                                tempImg.onerror = () => {
                                    clearTimeout(timeout);
                                    reject(new Error('이미지 로드 실패'));
                                };
                                tempImg.src = src;
                            });
                        }
                    }

                    if (!blob || blob.size === 0) {
                        throw new Error('빈 blob');
                    }

                    const extension = blob.type.split('/')[1] || 'jpg';
                    console.log(`이미지 ${i+1} 다운로드 성공: ${blob.size} bytes, ${extension}`);
                    return {
                        blob,
                        name: `image_${i + 1}.${extension}`
                    };
                } catch (error) {
                    console.error(`이미지 ${i+1} 다운로드 실패:`, error.message);
                    return null;
                }
            }

            // 메인 실행 함수
            const imgs = getAllImages();
            if (!imgs.length) {
                alert('이미지가 없습니다.');
                return;
            }
            
            console.log('이미지 수집 완료:', imgs.length + '개');

            const zip = new JSZip();
            let count = 0;
            const total = imgs.length;

            // 상태 표시 UI
            const status = document.createElement('div');
            status.style.cssText = 'position:fixed;top:10px;right:10px;background:#333;color:#fff;padding:10px;border-radius:5px;z-index:9999;font-family:sans-serif;';
            status.textContent = '이미지 수집 중... 0/' + total;
            document.body.appendChild(status);

            // 모든 이미지 처리
            const results = await Promise.all(
                imgs.map(async (img, i) => {
                    const result = await downloadImg(img, i);
                    count++;
                    status.textContent = `수집 완료: ${count}/${total}`;
                    if (result) {
                        zip.file(result.name, result.blob);
                        return result.name;
                    }
                    return null;
                })
            );

            const validCount = results.filter(r => r).length;
            console.log('유효한 이미지 수:', validCount);
            status.textContent = `ZIP 생성 중... (${validCount}개 이미지)`;

            // 유효한 이미지가 없으면 중단
            if (validCount === 0) {
                console.log('유효한 이미지가 없습니다');
                status.textContent = '다운로드 가능한 이미지가 없습니다!';
                setTimeout(() => document.body.removeChild(status), 3000);
                alert('다운로드 가능한 이미지가 없습니다. CORS 정책으로 인해 일부 이미지는 다운로드할 수 없습니다.');
                return;
            }

            // ZIP 파일 생성 및 다운로드
            try {
                console.log('ZIP 생성 시작...');
                const content = await zip.generateAsync({ type: 'blob' });
                console.log('ZIP 생성 완료, 크기:', content.size);
                
                // Chrome downloads API를 사용하기 위해 base64로 변환
                const reader = new FileReader();
                const base64Data = await new Promise((resolve) => {
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(content);
                });

                console.log('ZIP 생성 완료, base64 변환 완료');
                status.textContent = `다운로드 완료! (${validCount}개)`;
                setTimeout(() => document.body.removeChild(status), 3000);

                // background script에서 다운로드 처리하도록 반환
                return { 
                    action: 'downloadZip', 
                    base64Data: base64Data,
                    filename: `images_${Date.now()}.zip`,
                    message: `${validCount}개 이미지를 압축하여 다운로드했습니다.`
                };
            } catch (error) {
                console.error('ZIP 생성 중 오류:', error);
                status.textContent = 'ZIP 생성 실패!';
                setTimeout(() => document.body.removeChild(status), 3000);
                throw error;
            }
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
    
    // 이미지 숨기기
    hideImages: {
        func: function() {
            const existingStyle = document.getElementById('hide-images-style');
            if (existingStyle) {
                existingStyle.remove();
                alert('이미지가 다시 표시됩니다.');
            } else {
                const style = document.createElement('style');
                style.id = 'hide-images-style';
                style.textContent = `
                    img, picture, svg, video, 
                    [style*="background-image"], 
                    [style*="background: url"], 
                    [style*="background:url"] {
                        display: none !important;
                        visibility: hidden !important;
                    }
                    * {
                        background-image: none !important;
                    }
                `;
                document.head.appendChild(style);
                alert('모든 이미지가 숨겨졌습니다.');
            }
        }
    },
    
    // 이모지 제거
    removeEmojis: {
        func: function() {
            // 이모지를 감지하는 정규식
            const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{1FA70}-\u{1FAFF}]/gu;
            
            let removedCount = 0;
            
            // 텍스트 노드에서 이모지 제거
            function removeEmojisFromNode(node) {
                if (node.nodeType === Node.TEXT_NODE) {
                    const originalText = node.textContent;
                    const newText = originalText.replace(emojiRegex, (match) => {
                        removedCount++;
                        return '';
                    });
                    if (originalText !== newText) {
                        node.textContent = newText;
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    // input, textarea 등의 값에서도 제거
                    if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') {
                        const originalValue = node.value;
                        const newValue = originalValue.replace(emojiRegex, (match) => {
                            removedCount++;
                            return '';
                        });
                        if (originalValue !== newValue) {
                            node.value = newValue;
                        }
                    }
                    
                    // 자식 노드 순회
                    for (let child of node.childNodes) {
                        removeEmojisFromNode(child);
                    }
                }
            }
            
            removeEmojisFromNode(document.body);
            alert(`${removedCount}개의 이모지를 제거했습니다.`);
        }
    },
    
    // 목차 보기
    showTableOfContents: {
        func: function() {
            // 기존 목차가 있으면 제거
            if (document.getElementById('auto-toc-container')) {
                document.getElementById('auto-toc-container').remove();
                return;
            }
            
            // 모든 헤딩 요소 수집 (iframe 포함)
            function getAllHeadings() {
                let allHeadings = [];
                allHeadings.push(...document.querySelectorAll('h1,h2,h3,h4,h5,h6'));
                
                const iframes = document.querySelectorAll('iframe');
                iframes.forEach(iframe => {
                    try {
                        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                        if (iframeDoc) {
                            const iframeHeadings = iframeDoc.querySelectorAll('h1,h2,h3,h4,h5,h6');
                            iframeHeadings.forEach(heading => {
                                heading._isFromIframe = true;
                                heading._iframeSource = iframe;
                            });
                            allHeadings.push(...iframeHeadings);
                        }
                    } catch (e) {
                        console.log('iframe 접근 불가 (Cross-Origin):', iframe.src);
                    }
                });
                
                return allHeadings;
            }
            
            const headings = getAllHeadings();
            
            if (headings.length === 0) {
                alert('이 페이지에는 헤딩 요소가 없습니다.');
                return;
            }
            
            // 목차 컨테이너 생성
            const tocContainer = document.createElement('div');
            tocContainer.id = 'auto-toc-container';
            tocContainer.style.cssText = 'position:fixed;top:20px;right:20px;width:320px;max-height:70vh;overflow-y:auto;background:rgba(255,255,255,0.95);border:2px solid #4a5568;border-radius:10px;padding:20px;box-shadow:0 10px 30px rgba(0,0,0,0.3);z-index:9999;font-family:Arial,sans-serif;font-size:14px;line-height:1.4;backdrop-filter:blur(10px);';
            
            // 목차 제목
            const tocTitle = document.createElement('h3');
            tocTitle.textContent = '📑 목차';
            tocTitle.style.cssText = 'margin:0 0 15px 0;color:#4a5568;font-size:18px;border-bottom:2px solid #e2e8f0;padding-bottom:10px;';
            tocContainer.appendChild(tocTitle);
            
            // 목차 리스트
            const tocList = document.createElement('ul');
            tocList.style.cssText = 'list-style:none;padding:0;margin:0;';
            
            headings.forEach((heading, index) => {
                const level = parseInt(heading.tagName.charAt(1));
                const listItem = document.createElement('li');
                listItem.style.cssText = `margin:8px 0;padding-left:${(level-1)*15}px;`;
                
                const link = document.createElement('a');
                link.href = '#';
                const headingText = heading.textContent.trim();
                const displayText = heading._isFromIframe ? `[iframe] ${headingText}` : headingText;
                link.textContent = displayText;
                link.style.cssText = 'color:' + (heading._isFromIframe ? '#805ad5' : '#4a5568') + ';text-decoration:none;font-weight:' + (level <= 2 ? 'bold' : 'normal') + ';font-size:' + (level <= 2 ? '13px' : '12px') + ';display:block;padding:5px 8px;border-radius:5px;transition:all 0.2s ease;';
                
                // 호버 효과
                link.addEventListener('mouseenter', () => {
                    link.style.backgroundColor = '#e2e8f0';
                    link.style.color = '#2d3748';
                });
                
                link.addEventListener('mouseleave', () => {
                    link.style.backgroundColor = 'transparent';
                    link.style.color = heading._isFromIframe ? '#805ad5' : '#4a5568';
                });
                
                // 클릭 이벤트
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    if (heading._isFromIframe) {
                        heading._iframeSource.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        setTimeout(() => {
                            heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 300);
                    } else {
                        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                    
                    // 하이라이트 효과
                    heading.style.backgroundColor = '#fef5e7';
                    heading.style.transition = 'background-color 0.5s ease';
                    setTimeout(() => {
                        heading.style.backgroundColor = '';
                    }, 2000);
                });
                
                // ID가 없으면 생성
                if (!heading.id) {
                    heading.id = 'auto-toc-heading-' + index;
                }
                
                listItem.appendChild(link);
                tocList.appendChild(listItem);
            });
            
            tocContainer.appendChild(tocList);
            
            // 닫기 버튼
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '✕';
            closeBtn.style.cssText = 'position:absolute;top:5px;right:8px;background:none;border:none;font-size:18px;color:#718096;cursor:pointer;padding:5px;border-radius:3px;';
            closeBtn.addEventListener('click', () => {
                tocContainer.remove();
            });
            closeBtn.addEventListener('mouseenter', () => {
                closeBtn.style.backgroundColor = '#e2e8f0';
            });
            closeBtn.addEventListener('mouseleave', () => {
                closeBtn.style.backgroundColor = 'transparent';
            });
            
            tocContainer.appendChild(closeBtn);
            document.body.appendChild(tocContainer);
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
    
    // 드래깅 허용
    enableDrag: {
        func: function() {
            function enableDrag(doc) {
                // 드래그 제한을 해제하는 스타일 추가
                var s = doc.createElement('style');
                s.innerHTML = '*{-webkit-user-select:text!important;-moz-user-select:text!important;-ms-user-select:text!important;user-select:text!important;-webkit-touch-callout:default!important;}body{-webkit-user-select:text!important;user-select:text!important;}';
                doc.head.appendChild(s);
                
                // 드래그를 막는 이벤트 리스너 제거
                ['selectstart','dragstart','contextmenu','mousedown','keydown'].forEach(function(e) {
                    doc.addEventListener(e, function(t) {
                        t.stopPropagation();
                        return true;
                    }, true);
                });
                
                // 모든 요소의 드래그 관련 속성 초기화
                var els = doc.querySelectorAll('*');
                for (var i = 0; i < els.length; i++) {
                    var el = els[i];
                    el.onselectstart = el.ondragstart = el.oncontextmenu = el.onmousedown = null;
                    el.style.webkitUserSelect = 'text';
                    el.style.userSelect = 'text';
                    if (el.getAttribute('unselectable')) {
                        el.removeAttribute('unselectable');
                    }
                }
                
                // 문서 레벨의 이벤트 핸들러 제거
                doc.onselectstart = doc.ondragstart = doc.oncontextmenu = doc.onmousedown = null;
                
                // 동적으로 추가되는 요소도 처리
                var observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        if (mutation.addedNodes) {
                            for (var j = 0; j < mutation.addedNodes.length; j++) {
                                var node = mutation.addedNodes[j];
                                if (node.nodeType === 1) {
                                    node.style.webkitUserSelect = 'text';
                                    node.style.userSelect = 'text';
                                    node.onselectstart = node.ondragstart = node.oncontextmenu = null;
                                }
                            }
                        }
                    });
                });
                observer.observe(doc.body, {childList: true, subtree: true});
            }
            
            // 메인 문서에 적용
            enableDrag(document);
            
            // 모든 iframe에도 적용
            var frames = document.querySelectorAll('iframe');
            for (var i = 0; i < frames.length; i++) {
                try {
                    if (frames[i].contentDocument) {
                        enableDrag(frames[i].contentDocument);
                    }
                } catch(e) {
                    console.log('iframe 접근 불가:', e);
                }
            }
            
            // 나중에 로드되는 iframe도 처리
            setTimeout(function() {
                var newFrames = document.querySelectorAll('iframe');
                for (var k = 0; k < newFrames.length; k++) {
                    try {
                        if (newFrames[k].contentDocument) {
                            enableDrag(newFrames[k].contentDocument);
                        }
                    } catch(e) {}
                }
            }, 1000);
            
            alert('드래깅이 활성화되었습니다! (iframe 포함)');
        }
    },
    
    // 문자 찾기 - 단어강조 표시
    highlightWords: {
        func: function() {
            const input = prompt("정규식 입력 (예: foo 또는 \\d+):");
            if (!input) return;
            
            let regex;
            try {
                regex = new RegExp(input, "gi");
            } catch(e) {
                alert("⚠️ 유효하지 않은 정규식입니다.");
                return;
            }
            
            let totalMatches = 0;
            
            // 애니메이션 스타일 추가
            const style = document.createElement("style");
            style.textContent = `
                @keyframes regex-blink {
                    0%, 100% {
                        background-color: yellow;
                        color: red;
                    }
                    50% {
                        background-color: red;
                        color: yellow;
                    }
                }
                .regex-highlight {
                    animation: regex-blink 1s infinite;
                    font-weight: bold;
                    padding: 0 2px;
                    border-radius: 2px;
                }
            `;
            document.head.appendChild(style);
            
            // 텍스트 노드 순회 및 하이라이트
            const walk = (root) => {
                const highlight = (node) => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        const parent = node.parentNode;
                        const text = node.textContent;
                        regex.lastIndex = 0;
                        
                        let match, lastIndex = 0;
                        const frag = document.createDocumentFragment();
                        
                        while ((match = regex.exec(text)) !== null) {
                            const before = text.slice(lastIndex, match.index);
                            const matched = match[0];
                            
                            if (before) frag.appendChild(document.createTextNode(before));
                            
                            const span = document.createElement("span");
                            span.textContent = matched;
                            span.className = "regex-highlight";
                            frag.appendChild(span);
                            
                            totalMatches++;
                            lastIndex = regex.lastIndex;
                        }
                        
                        if (lastIndex < text.length) {
                            frag.appendChild(document.createTextNode(text.slice(lastIndex)));
                        }
                        
                        if (frag.childNodes.length > 0) {
                            parent.replaceChild(frag, node);
                        }
                    } else if (node.nodeType === Node.ELEMENT_NODE && 
                               !["SCRIPT", "STYLE", "NOSCRIPT"].includes(node.tagName)) {
                        for (let i = 0; i < node.childNodes.length; i++) {
                            highlight(node.childNodes[i]);
                        }
                    }
                };
                
                highlight(root.body);
                
                // iframe에도 스타일 적용
                try {
                    if (root !== document) {
                        const iframeStyle = root.createElement("style");
                        iframeStyle.textContent = style.textContent;
                        root.head.appendChild(iframeStyle);
                    }
                } catch(e) {}
            };
            
            // 메인 문서에 적용
            walk(document);
            
            // iframe에도 적용
            const iframes = document.querySelectorAll("iframe");
            for (const iframe of iframes) {
                try {
                    const doc = iframe.contentDocument || iframe.contentWindow.document;
                    walk(doc);
                } catch(e) {}
            }
            
            alert(totalMatches > 0 ? 
                `✅ 총 ${totalMatches}개의 항목이 하이라이트 + 번쩍입니다.` : 
                "❌ 일치 항목이 없습니다.");
        }
    },
    
    // 문자 찾기 - 파란색 번쩍
    highlightWordsBlue: {
        func: function() {
            const input = prompt("정규식 입력 (예: foo 또는 \\d+):");
            if (!input) return;
            
            let regex;
            try {
                regex = new RegExp(input, "gi");
            } catch(e) {
                alert("⚠️ 유효하지 않은 정규식입니다.");
                return;
            }
            
            let totalMatches = 0;
            
            // 파란색 애니메이션 스타일 추가
            const style = document.createElement("style");
            style.textContent = `
                @keyframes regex-blink-blue {
                    0%, 100% {
                        background-color: #00BFFF;
                        color: white;
                    }
                    50% {
                        background-color: #0000FF;
                        color: #00FFFF;
                    }
                }
                .regex-highlight-blue {
                    animation: regex-blink-blue 1s infinite;
                    font-weight: bold;
                    padding: 0 2px;
                    border-radius: 2px;
                }
            `;
            document.head.appendChild(style);
            
            // 텍스트 노드 순회 및 하이라이트
            const walk = (root) => {
                const highlight = (node) => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        const parent = node.parentNode;
                        const text = node.textContent;
                        regex.lastIndex = 0;
                        
                        let match, lastIndex = 0;
                        const frag = document.createDocumentFragment();
                        
                        while ((match = regex.exec(text)) !== null) {
                            const before = text.slice(lastIndex, match.index);
                            const matched = match[0];
                            
                            if (before) frag.appendChild(document.createTextNode(before));
                            
                            const span = document.createElement("span");
                            span.textContent = matched;
                            span.className = "regex-highlight-blue";
                            frag.appendChild(span);
                            
                            totalMatches++;
                            lastIndex = regex.lastIndex;
                        }
                        
                        if (lastIndex < text.length) {
                            frag.appendChild(document.createTextNode(text.slice(lastIndex)));
                        }
                        
                        if (frag.childNodes.length > 0) {
                            parent.replaceChild(frag, node);
                        }
                    } else if (node.nodeType === Node.ELEMENT_NODE && 
                               !["SCRIPT", "STYLE", "NOSCRIPT"].includes(node.tagName)) {
                        for (let i = 0; i < node.childNodes.length; i++) {
                            highlight(node.childNodes[i]);
                        }
                    }
                };
                
                highlight(root.body);
                
                // iframe에도 스타일 적용
                try {
                    if (root !== document) {
                        const iframeStyle = root.createElement("style");
                        iframeStyle.textContent = style.textContent;
                        root.head.appendChild(iframeStyle);
                    }
                } catch(e) {}
            };
            
            // 메인 문서에 적용
            walk(document);
            
            // iframe에도 적용
            const iframes = document.querySelectorAll("iframe");
            for (const iframe of iframes) {
                try {
                    const doc = iframe.contentDocument || iframe.contentWindow.document;
                    walk(doc);
                } catch(e) {}
            }
            
            alert(totalMatches > 0 ? 
                `🔵 총 ${totalMatches}개의 항목이 파란색으로 번쩍입니다.` : 
                "❌ 일치 항목이 없습니다.");
        }
    },
    
    // 문자 찾기 - 초록색 번쩍
    highlightWordsGreen: {
        func: function() {
            const input = prompt("정규식 입력 (예: foo 또는 \\d+):");
            if (!input) return;
            
            let regex;
            try {
                regex = new RegExp(input, "gi");
            } catch(e) {
                alert("⚠️ 유효하지 않은 정규식입니다.");
                return;
            }
            
            let totalMatches = 0;
            
            // 초록색 애니메이션 스타일 추가
            const style = document.createElement("style");
            style.textContent = `
                @keyframes regex-blink-green {
                    0%, 100% {
                        background-color: #00FF00;
                        color: #006400;
                    }
                    50% {
                        background-color: #228B22;
                        color: #90EE90;
                    }
                }
                .regex-highlight-green {
                    animation: regex-blink-green 1s infinite;
                    font-weight: bold;
                    padding: 0 2px;
                    border-radius: 2px;
                    text-shadow: 0 0 2px rgba(0,255,0,0.5);
                }
            `;
            document.head.appendChild(style);
            
            // 텍스트 노드 순회 및 하이라이트
            const walk = (root) => {
                const highlight = (node) => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        const parent = node.parentNode;
                        const text = node.textContent;
                        regex.lastIndex = 0;
                        
                        let match, lastIndex = 0;
                        const frag = document.createDocumentFragment();
                        
                        while ((match = regex.exec(text)) !== null) {
                            const before = text.slice(lastIndex, match.index);
                            const matched = match[0];
                            
                            if (before) frag.appendChild(document.createTextNode(before));
                            
                            const span = document.createElement("span");
                            span.textContent = matched;
                            span.className = "regex-highlight-green";
                            frag.appendChild(span);
                            
                            totalMatches++;
                            lastIndex = regex.lastIndex;
                        }
                        
                        if (lastIndex < text.length) {
                            frag.appendChild(document.createTextNode(text.slice(lastIndex)));
                        }
                        
                        if (frag.childNodes.length > 0) {
                            parent.replaceChild(frag, node);
                        }
                    } else if (node.nodeType === Node.ELEMENT_NODE && 
                               !["SCRIPT", "STYLE", "NOSCRIPT"].includes(node.tagName)) {
                        for (let i = 0; i < node.childNodes.length; i++) {
                            highlight(node.childNodes[i]);
                        }
                    }
                };
                
                highlight(root.body);
                
                // iframe에도 스타일 적용
                try {
                    if (root !== document) {
                        const iframeStyle = root.createElement("style");
                        iframeStyle.textContent = style.textContent;
                        root.head.appendChild(iframeStyle);
                    }
                } catch(e) {}
            };
            
            // 메인 문서에 적용
            walk(document);
            
            // iframe에도 적용
            const iframes = document.querySelectorAll("iframe");
            for (const iframe of iframes) {
                try {
                    const doc = iframe.contentDocument || iframe.contentWindow.document;
                    walk(doc);
                } catch(e) {}
            }
            
            alert(totalMatches > 0 ? 
                `🟢 총 ${totalMatches}개의 항목이 초록색으로 번쩍입니다.` : 
                "❌ 일치 항목이 없습니다.");
        }
    },
    
    // 문자 찾기 - 보라색 번쩍
    highlightWordsPurple: {
        func: function() {
            const input = prompt("정규식 입력 (예: foo 또는 \\d+):");
            if (!input) return;
            
            let regex;
            try {
                regex = new RegExp(input, "gi");
            } catch(e) {
                alert("⚠️ 유효하지 않은 정규식입니다.");
                return;
            }
            
            let totalMatches = 0;
            
            // 보라색 애니메이션 스타일 추가
            const style = document.createElement("style");
            style.textContent = `
                @keyframes regex-blink-purple {
                    0%, 100% {
                        background-color: #FF00FF;
                        color: white;
                        box-shadow: 0 0 10px #FF00FF;
                    }
                    50% {
                        background-color: #8B008B;
                        color: #DDA0DD;
                        box-shadow: 0 0 20px #8B008B;
                    }
                }
                .regex-highlight-purple {
                    animation: regex-blink-purple 1s infinite;
                    font-weight: bold;
                    padding: 0 4px;
                    border-radius: 4px;
                    display: inline-block;
                }
            `;
            document.head.appendChild(style);
            
            // 텍스트 노드 순회 및 하이라이트
            const walk = (root) => {
                const highlight = (node) => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        const parent = node.parentNode;
                        const text = node.textContent;
                        regex.lastIndex = 0;
                        
                        let match, lastIndex = 0;
                        const frag = document.createDocumentFragment();
                        
                        while ((match = regex.exec(text)) !== null) {
                            const before = text.slice(lastIndex, match.index);
                            const matched = match[0];
                            
                            if (before) frag.appendChild(document.createTextNode(before));
                            
                            const span = document.createElement("span");
                            span.textContent = matched;
                            span.className = "regex-highlight-purple";
                            frag.appendChild(span);
                            
                            totalMatches++;
                            lastIndex = regex.lastIndex;
                        }
                        
                        if (lastIndex < text.length) {
                            frag.appendChild(document.createTextNode(text.slice(lastIndex)));
                        }
                        
                        if (frag.childNodes.length > 0) {
                            parent.replaceChild(frag, node);
                        }
                    } else if (node.nodeType === Node.ELEMENT_NODE && 
                               !["SCRIPT", "STYLE", "NOSCRIPT"].includes(node.tagName)) {
                        for (let i = 0; i < node.childNodes.length; i++) {
                            highlight(node.childNodes[i]);
                        }
                    }
                };
                
                highlight(root.body);
                
                // iframe에도 스타일 적용
                try {
                    if (root !== document) {
                        const iframeStyle = root.createElement("style");
                        iframeStyle.textContent = style.textContent;
                        root.head.appendChild(iframeStyle);
                    }
                } catch(e) {}
            };
            
            // 메인 문서에 적용
            walk(document);
            
            // iframe에도 적용
            const iframes = document.querySelectorAll("iframe");
            for (const iframe of iframes) {
                try {
                    const doc = iframe.contentDocument || iframe.contentWindow.document;
                    walk(doc);
                } catch(e) {}
            }
            
            alert(totalMatches > 0 ? 
                `🟣 총 ${totalMatches}개의 항목이 보라색으로 번쩍입니다.` : 
                "❌ 일치 항목이 없습니다.");
        }
    },
    
    // 문자 찾기 - 무지개색 번쩍
    highlightWordsRainbow: {
        func: function() {
            const input = prompt("정규식 입력 (예: foo 또는 \\d+):");
            if (!input) return;
            
            let regex;
            try {
                regex = new RegExp(input, "gi");
            } catch(e) {
                alert("⚠️ 유효하지 않은 정규식입니다.");
                return;
            }
            
            let totalMatches = 0;
            
            // 무지개색 애니메이션 스타일 추가
            const style = document.createElement("style");
            style.textContent = `
                @keyframes regex-blink-rainbow {
                    0% { background-color: #FF0000; color: white; }
                    14% { background-color: #FF7F00; color: black; }
                    28% { background-color: #FFFF00; color: black; }
                    42% { background-color: #00FF00; color: black; }
                    57% { background-color: #0000FF; color: white; }
                    71% { background-color: #4B0082; color: white; }
                    85% { background-color: #9400D3; color: white; }
                    100% { background-color: #FF0000; color: white; }
                }
                .regex-highlight-rainbow {
                    animation: regex-blink-rainbow 2s infinite;
                    font-weight: bold;
                    padding: 2px 4px;
                    border-radius: 3px;
                    display: inline-block;
                    transform: scale(1.1);
                }
            `;
            document.head.appendChild(style);
            
            // 텍스트 노드 순회 및 하이라이트
            const walk = (root) => {
                const highlight = (node) => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        const parent = node.parentNode;
                        const text = node.textContent;
                        regex.lastIndex = 0;
                        
                        let match, lastIndex = 0;
                        const frag = document.createDocumentFragment();
                        
                        while ((match = regex.exec(text)) !== null) {
                            const before = text.slice(lastIndex, match.index);
                            const matched = match[0];
                            
                            if (before) frag.appendChild(document.createTextNode(before));
                            
                            const span = document.createElement("span");
                            span.textContent = matched;
                            span.className = "regex-highlight-rainbow";
                            frag.appendChild(span);
                            
                            totalMatches++;
                            lastIndex = regex.lastIndex;
                        }
                        
                        if (lastIndex < text.length) {
                            frag.appendChild(document.createTextNode(text.slice(lastIndex)));
                        }
                        
                        if (frag.childNodes.length > 0) {
                            parent.replaceChild(frag, node);
                        }
                    } else if (node.nodeType === Node.ELEMENT_NODE && 
                               !["SCRIPT", "STYLE", "NOSCRIPT"].includes(node.tagName)) {
                        for (let i = 0; i < node.childNodes.length; i++) {
                            highlight(node.childNodes[i]);
                        }
                    }
                };
                
                highlight(root.body);
                
                // iframe에도 스타일 적용
                try {
                    if (root !== document) {
                        const iframeStyle = root.createElement("style");
                        iframeStyle.textContent = style.textContent;
                        root.head.appendChild(iframeStyle);
                    }
                } catch(e) {}
            };
            
            // 메인 문서에 적용
            walk(document);
            
            // iframe에도 적용
            const iframes = document.querySelectorAll("iframe");
            for (const iframe of iframes) {
                try {
                    const doc = iframe.contentDocument || iframe.contentWindow.document;
                    walk(doc);
                } catch(e) {}
            }
            
            alert(totalMatches > 0 ? 
                `🌈 총 ${totalMatches}개의 항목이 무지개색으로 번쩍입니다.` : 
                "❌ 일치 항목이 없습니다.");
        }
    }
};