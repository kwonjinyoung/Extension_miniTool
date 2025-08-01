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
            const start = () => {
                const imgs=getAllImages();
                if(!imgs.length){
                    alert('이미지가 없습니다.');
                    return;
                }
                
                const zip=new JSZip();
                let count=0;
                const total=imgs.length;
                const status=document.createElement('div');
                status.style.cssText='position:fixed;top:10px;right:10px;background:#333;color:#fff;padding:10px;border-radius:5px;z-index:9999;font-family:sans-serif;';
                status.textContent='이미지 수집 중... 0/'+total;
                document.body.appendChild(status);
                
                Promise.all(imgs.map(async(img,i)=>{
                    const result=await downloadImg(img,i);
                    count++;
                    status.textContent=`수집 완료: ${count}/${total}`;
                    if(result){
                        zip.file(result.name,result.blob);
                        return result.name;
                    }
                    return null;
                })).then(results=>{
                    const validCount=results.filter(r=>r).length;
                    status.textContent=`ZIP 생성 중... (${validCount}개 이미지)`;
                    zip.generateAsync({type:'blob'}).then(content=>{
                        const url=URL.createObjectURL(content);
                        const a=document.createElement('a');
                        a.href=url;
                        a.download=`images_${Date.now()}.zip`;
                        a.click();
                        URL.revokeObjectURL(url);
                        status.textContent=`다운로드 완료! (${validCount}개)`;
                        setTimeout(()=>document.body.removeChild(status),3000);
                    });
                });
            };
            
            if(!window.JSZip){
                const s=document.createElement('script');
                s.src='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
                s.onload=()=>start();
                document.head.appendChild(s);
            } else {
                start();
            }
            
            function getAllImages(){
                const f=document.getElementById('mainFrame');
                let d=f&&f.contentDocument?f.contentDocument:document;
                const images=[];
                const urls=new Set();
                
                function collect(doc){
                    try{
                        Array.from(doc.getElementsByTagName('img')).forEach(img=>{
                            if(img.src&&!urls.has(img.src)){
                                images.push(img);
                                urls.add(img.src);
                            }
                        });
                        
                        Array.from(doc.getElementsByTagName('*')).forEach(el=>{
                            try{
                                const bg=getComputedStyle(el).backgroundImage;
                                if(bg&&bg!=='none'){
                                    const matches=bg.match(/url\(['"]?([^'"]+)['"]?\)/g);
                                    if(matches){
                                        matches.forEach(m=>{
                                            const url=m.replace(/url\(['"]?([^'"]+)['"]?\)/,'$1');
                                            if(url&&!urls.has(url)){
                                                const vImg=doc.createElement('img');
                                                vImg.src=url;
                                                images.push(vImg);
                                                urls.add(url);
                                            }
                                        });
                                    }
                                }
                            }catch(e){}
                        });
                        
                        if(doc===document){
                            Array.from(doc.getElementsByTagName('iframe')).forEach(iframe=>{
                                if(iframe.id!=='mainFrame'&&iframe.name!=='mainFrame'){
                                    try{
                                        if(iframe.contentDocument) collect(iframe.contentDocument);
                                    }catch(e){}
                                }
                            });
                            
                            Array.from(doc.getElementsByTagName('frame')).forEach(frame=>{
                                try{
                                    if(frame.contentDocument) collect(frame.contentDocument);
                                }catch(e){}
                            });
                        }
                    }catch(e){}
                }
                
                collect(d);
                console.log(`총 ${images.length}개 이미지 발견`);
                return images;
            }
            
            async function downloadImg(img,i){
                let src=img.src;
                if(src&&!src.startsWith('http')&&!src.startsWith('data:'))
                    src=new URL(src,location.href).href;
                if(!src||src.startsWith('data:image/svg')||src.length<10)
                    return null;
                    
                try{
                    let blob;
                    try{
                        const res=await fetch(src,{mode:'cors'});
                        if(res.ok) blob=await res.blob();
                        else throw new Error();
                    }catch{
                        try{
                            const res=await fetch(src,{mode:'no-cors'});
                            blob=await res.blob();
                        }catch{
                            const canvas=document.createElement('canvas');
                            const ctx=canvas.getContext('2d');
                            const tempImg=new Image();
                            tempImg.crossOrigin='anonymous';
                            await new Promise((resolve,reject)=>{
                                tempImg.onload=()=>{
                                    canvas.width=tempImg.naturalWidth||tempImg.width;
                                    canvas.height=tempImg.naturalHeight||tempImg.height;
                                    ctx.drawImage(tempImg,0,0);
                                    canvas.toBlob(b=>b?resolve(blob=b):reject(),'image/png');
                                };
                                tempImg.onerror=reject;
                                tempImg.src=src;
                            });
                        }
                    }
                    
                    if(!blob||blob.size===0) throw new Error();
                    return {blob,name:`image_${i+1}.${blob.type.split('/')[1]||'jpg'}`};
                }catch{
                    return null;
                }
            }
            
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