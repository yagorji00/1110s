// 마스터 정보 조회
let sessionUserId = "";
function searchMstInfo () {

    activeOfficeCd = $('#officeList').val();
    selectedInputDate = $('#inputDate').val().replaceAll('-','');

    let param = {
        officeCd: activeOfficeCd,
        inputDate: selectedInputDate
    }

    skec.postAjax('/stp/api/subnote/selectSubNoteMst', param, function (res) {

        initMstInfo(res.body.mstList);

        // 사용자 선택 시 선택한 사업소 콤보 박스 리스트 출력, 20230327, 이미남
        //멤버 목록(팝업용)
        memberListBySite = res.body.memberListBySite;

        // 실험노트 조회
        let tabId = getActiveTabId();
        switch ( tabId ) {
            case 'toc' :
                searchToc(param);
                break;
            case 'tn' :
            case 'tp' :
                param.tntpCategory = tabId.toUpperCase();
                searchTntp(param);
                break;
            case 'etc':
                searchEtc(param);
                break;
            case 'bod':
                searchBod(param);
                break;
            case 'ss':
                searchSs(param);
                break;
            case 'coli':
                searchColi(param);
                break;
            default :
                searchAll(param);
                break;
        }

    });
}


// 마스터 정보 초기화
function initMstInfo ( _mstInfo ) {

    // 채수일자 기준
    let year = selectedInputDate.substring(0,4);
    let month = selectedInputDate.substring(4,6) - 1;
    let day = selectedInputDate.substring(6,8);

    let myDate = new Date(year,month,day);
    let _myDate = utils.dateFormat('YYYYmmdd', myDate);

    // 시험일자 세팅
    if (_mstInfo.tocSamplingDate == null)
        _mstInfo.tocSamplingDate = _myDate;

    if (_mstInfo.tnSamplingDate == null)
        _mstInfo.tnSamplingDate = _myDate;

    if (_mstInfo.tpSamplingDate == null)
        _mstInfo.tpSamplingDate = _myDate;

    if (_mstInfo.ssSamplingDate == null)
        _mstInfo.ssSamplingDate = _myDate;

    // BOD 시험기록부에 저장된 값이 없을 경우 : 5일전 세팅
    if ( _mstInfo.bodSamplingDate == null ) {
        let bodDate = new Date(year,month,day);
        let dayOfMonth = bodDate.getDate();
        bodDate.setDate( dayOfMonth - 5 );
        _mstInfo.bodSamplingDate = utils.dateFormat('YYYYmmdd',bodDate);
    }

    // 대장균군 시험기록부에 저장된 값이 없을 경우 : 1일전 세팅
    if (_mstInfo.coliSamplingDate == null) {
        let coliDate = new Date(year,month,day);
        let dayOfMonth = coliDate.getDate();
        coliDate.setDate( dayOfMonth - 1 );
        _mstInfo.coliSamplingDate = utils.dateFormat('YYYYmmdd',coliDate);
    }

    // 추가 채수일자 여부
    if (_mstInfo.addInputChk == null) {
        _mstInfo.addInputChk = 'N';
    }

    mstInfo = _mstInfo;
    originMstInfo = JSON.stringify(mstInfo); // 초기값

    // 버튼 숨김 처리, 김형조, 선우희건,김형준만 보임.
    // $("#cancelAppr").hide();
    // if( _mstInfo.userId == 'k11429' ||_mstInfo.userId == 'syaea'  ||_mstInfo.userId == 'swhkss' ){
    //     $("#cancelAppr").show();
    // }
    sessionUserId = _mstInfo.userId ;
    setMstInfo();

}


// 마스터 정보 세팅
function setMstInfo () {

    //--------------------- 일자 ------------------------
    setSamplingDate('addInputDate', mstInfo.addInputDate); // 추가 채수일자
    setSamplingDate('tocSamplingDate', mstInfo.tocSamplingDate);
    setSamplingDate('tnSamplingDate', mstInfo.tnSamplingDate);
    setSamplingDate('tpSamplingDate', mstInfo.tpSamplingDate);
    setSamplingDate('bodSamplingDate', mstInfo.bodSamplingDate);
    setSamplingDate('coliSamplingDate', mstInfo.coliSamplingDate);
    setSamplingDate('ssSamplingDate', mstInfo.ssSamplingDate);


    //--------------------- 담당자 ------------------------
    setTester('repTesterUser', mstInfo.repTesterUserNm, mstInfo.repTesterUserId);
    setTester('tocTester', mstInfo.tocTesterNm, mstInfo.tocTesterId);
    setTester('tnTester', mstInfo.tnTesterNm, mstInfo.tnTesterId);
    setTester('tpTester', mstInfo.tpTesterNm, mstInfo.tpTesterId);
    setTester('bodTester', mstInfo.bodTesterNm, mstInfo.bodTesterId);
    setTester('coliTester', mstInfo.coliTesterNm, mstInfo.coliTesterId);
    setTester('ssTester', mstInfo.ssTesterNm, mstInfo.ssTesterId);


    //--------------------- 체크박스 ------------------------
    // 추가 채수일자
    let addInputChk = mstInfo.addInputChk;
    if (addInputChk == 'Y') {
        $("#addInputChk").prop('checked', true);
    } else {
        $("#addInputChk").prop('checked',false);
    }

    // 시료채취 완료 처리장 검색 체크박스 활성화여부
    let siteWithSampleData = JSON.parse(mstInfo.siteWithSampleData);
    let checkSampleData = $('.tabs_content .search input[type=checkbox]');

    if ( siteWithSampleData.length > 0 ) {

        isExistSampleData = true;
        // 체크 활성화
        $(checkSampleData).each(function (){
            $(this).prop('disabled', true);
            $(this).prop('checked', false);
            $(this).removeClass('disabled');
        });

    } else {

        isExistSampleData = false;
        // 체크 비활성화
        $(checkSampleData).each(function (){
            $(this).prop('disabled', true);
            $(this).prop('checked', false);
            $(this).addClass('disabled');
        });
    }


    //--------------------- 버튼 영역 ------------------------
    // 결제 상태 체크
    let stat = mstInfo.stat||'';
    if (stat == 'S' || stat == 'A') {

        commonUI.button.disable('ocrRoad') ;   // OCR 불러오기
        commonUI.button.disable('checkAll');   // 데이터체크
        commonUI.button.disable('saveAll');    // 실험노트 저장
        commonUI.button.disable('apprAll');    // 결제
        commonUI.button.disable('saveToc');    // TOC 저장
        commonUI.button.disable('saveTn');     // T-N 저장
        commonUI.button.disable('saveTp');     // T-P 저장
        commonUI.button.disable('saveColi');    // 대장균군 저장
        commonUI.button.disable('saveBod');    // BOD
        commonUI.button.disable('saveSs');    // SS

        let canselApprStat = mstInfo.canselApprStat||'';

        // 결재 승인 완료 상태 (A), 결재 취소 요청 하지 않을때 (null), 결재 취소 반려 (R) 결재 취소 가능
        if((stat == 'A' && canselApprStat == '') || (stat == 'A' && canselApprStat == 'R')){
            commonUI.button.enable('cancelAppr') ;  // 결재 삭제
        }else{
            commonUI.button.disable('cancelAppr') ;  // 결재 취소
        }



    } else {

        commonUI.button.enable('ocrRoad') ;   // OCR 불러오기
        commonUI.button.enable('checkAll');   // 데이터체크
        commonUI.button.enable('saveAll');    // 실험노트 저장
        commonUI.button.enable('apprAll');    // 결제
        commonUI.button.enable('saveToc');    // TOC 저장
        commonUI.button.enable('saveTn');     // T-N 저장
        commonUI.button.enable('saveTp');     // T-P 저장
        commonUI.button.enable('saveColi');    // 대장균군 저장
        commonUI.button.enable('saveSs');    // SS
        commonUI.button.enable('saveBod');    // BOD
        commonUI.button.disable('cancelAppr') ;  // 결재 취소


        //OCR 저장 데이터가 없을 경우 비활성화
        if (mstInfo.ocrRoadCnt > 0) {
            commonUI.button.enable('ocrRoad');
        } else {
            commonUI.button.disable('ocrRoad');
        }

    }

}


// 마스터 정보 변경
function changeMstInfo (k, v) {
    mstInfo[k] = v;
}


// 공통 마스터 파라미터
function getMstParam () {
    let param = {
        inputDate: selectedInputDate,
        officeCd: activeOfficeCd,
        addInputDate: mstInfo.addInputDate,
        addInputChk: mstInfo.addInputChk,
    }
    return param;
}


// 일자 입력
function setSamplingDate (el, date) {
    let formatDate = '';
    if ( date != null && date.length == 8 ) {
        formatDate = date.substring(0,4) + '-' + date.substring(4,6) + '-' + date.substring(6,8);
    }
    $('#'+el).val(formatDate);
}


// 담당자 입력
function setTester (el, name, id) {
    $('#'+el+'Nm').val(name);
    $('#'+el+'Id').val(id);
}


// 그리드 새로고침
function fgRefresh (fg, time) {
    setTimeout(function (){
        fg.refresh();
        commonUI.fitSize();
    },time)
}


// 소수점 수정
function decimalModify (fg, e) {

    const data = e.panel.getCellData(e.row, e.col, false);

    if ( data == null || data == '' ) return;

    let baseLength;
    let binding = fg.columns[e.col].binding;

    switch (binding) {
        case 'bodP':        // 실험노트작성 : BOD 원시료희석배수
        case 'bodNo':       // 실험노트작성 : BOD 병번호
        case 'tocP':        // 실험노트작성 : TOC 원시료희석배수
        case 'ssNo':        // 실험노트작성 : SS 여지번호
        case 'ssMl':        // 실험노트작성 : SS 시료량
        case 'ssP':         // 실험노트작성 : SS 원시료희석배수
        case 'tnP':         // 실험노트작성 : T-N 원시료희석배수
        case 'tpP':         // 실험노트작성 : T-P 원시료희석배수
        case 'coliP':       // 실험노트작성 : 총대장균군희석배수
        case 'coliA':       // 실험노트작성 : 총대장균군 A
        case 'coliB':       // 실험노트작성 : 총대장균군 B
        case 'tnMlV2':      // T-N 실험노트 : 총시료량
        case 'tnMlPre':     // T-N 실험노트 : 전처리량
        case 'tnP2':        // T-N 실험노트 : 원시료희석배수
        case 'tpMlV2':      // T-P 실험노트 : 총시료량
        case 'tpMlPre':     // T-P 실험노트 : 전처리량
        case 'tpP2':        // T-P 실험노트 : 원시료희석배수
            baseLength = 0; break;
        case 'bodMl':       // 실험노트작성 : BOD 샘플시료량
        case 'ssMgAfter':   // 실험노트작성 : SS 여과후무게
        case 'ssMgBefore':  // 실험노트작성 : SS 여과전무게
        case 'coliP2':      // 실험노트작성 : 총대장균군 원시료희석배수
        case 'toc':         // TOC 시험기록부 : TOC
        case 'STD_0':       // TOC 시험기록부(상단) : STD_0
        case 'STD_1':       // TOC 시험기록부(상단) : STD_1
        case 'STD_2':       // TOC 시험기록부(상단) : STD_2
        case 'STD_3':       // TOC 시험기록부(상단) : STD_3
        case 'STD_4':       // TOC 시험기록부(상단) : STD_4
        case 'ML':          // T-N/T-P 상단그리드(공통) : 시료량
            baseLength = 1; break;
        case 'bodD1':       // 실험노트작성 : BOD D1
        case 'bodD2':       // 실험노트작성 : BOD D2
        case 'tocMl':       // 실험노트작성 : TOC 시료주입량
        case 'tnMl':        // 실험노트작성 : T-N 시료량
        case 'tpMl':        // 실험노트작성 : T-P 시료량
        case 'tnMlV1':      // T-N 실험노트 : 샘플시료량
        case 'tnP1':        // T-N 시험기록부 : 희석배수
        case 'tpMlV1':      // T-P 실험노트 : 샘플시료량
        case 'tpP1':        // T-P 시험기록부 : 희석배수
        case 'MG':          // T-N/T-P 상단그리드(공통) : 표준액농도
            baseLength = 2; break;
        case 'tocTcMg':     // TOC 시험기록부 : TC 농도
        case 'tocIcMg':     // TOC 시험기록부 : IC 농도
        case 'npocMg':      // TOC 시험기록부 : NPOC 농도
        case 'tn':          // T-N 시험기록부 : T-N
        case 'tp':          // T-P 시험기록부 : T-P
            baseLength = 3; break;
        case 'LIGHT':       // T-N/T-P 상단그리드(공통) : 표준액흡광도
        case 'tnLight':     // T-N 시험기록부 : 시료흡광도
        case 'tnDensityMg': // T-N 시험기록부 : 기기농도
        case 'tpLight':     // T-P 시험기록부 : 시료흡광도
        case 'tpDensityMg': // T-P 시험기록부 : 기기농도

            let dataArr = data.split('.');

            if (dataArr.length > 1 && dataArr[1].length >= 4) {
                // 소수점 4자리이상 : 그대로 출력
                baseLength = 4; break;
            } else {
                // 소수 3자리 이하 : 소수점 3자리 출력
                baseLength = 3; break;
            }
    }

    let pow = Math.pow(10, baseLength);
    let round = Math.round(Number(data).toFixed(baseLength+2) + ( 'e+' + baseLength)  )  / pow;
    //round.toFixed(baseLength);

    return round ;

}


// 소수점 자리수 체크
function decimalLengthCheck ( count , value ) {
    let result = true;

    if ( !isNaN(value) ) {
        let pointIndex = String(value).indexOf('.');
        if (pointIndex > -1) {
            let decimalLength = String(value).split('.')[1].length;
            if ( count < decimalLength ) {
                result = false;
            }
        }

    } else {
        result = false;
    }
    return result;
}


// 그리드 셀 유효성 체크
function validateCellData ( fg, e, decimal, cb ) {
    let beforeData = setCellEditEndingData(e); // 이전 데이터
    let editData = fg.activeEditor.value;

    // 삭제가 아닐 경우
    if (beforeData != 'Delete') {
        if ( !(beforeData == '' && editData == '') ) {
            if ( !decimalLengthCheck(decimal, editData) ) {
                if (decimal == 4) {
                    cb (beforeData, '숫자(소수점 네자리까지)만 입력해주세요.');
                } else {
                    cb (beforeData, '숫자(소수점 다섯자리까지)만 입력해주세요.');
                }
            }
        }
    }
}


// 체크 로직 항목 삭제
function deleteValidateColumn (fg) {

    let items = fg._cv.items;

    if ( items.length > 0 ) {

        for ( let i = 0; i < items.length; i++ ) {
            let item = items[i];
            switch (fg) {
                case fgAll:
                    delete item.bodValiChk;
                    delete item.ssChk;
                    delete item.coliAChk;
                    delete item.coliBChk;
                    break;
                case fgToc1:
                    delete item.r2Chk;
                    break;
                case fgToc2:
                    delete item.tocTcMgChk;
                    delete item.tocIcMgChk;
                    delete item.npocMgChk;
                    delete item.tocChk;
                    break;
                case fgTn1:
                    delete item.tnR2Chk;
                    break;
                case fgTn2:
                    delete item.tnDensityMgChk;
                    delete item.tnChk;
                    break;
                case fgTp1:
                    delete item.tpR2Chk;
                    break;
                case fgTp2:
                    delete item.tpDensityMgChk;
                    delete item.tpChk;
                    break;
            }
        }
    }
    return fg;

}


// 그리드 셀 변경 타입 별 값 세팅
function setCellEditEndingData (e) {

    let data;

    if ( e._data == null ) {
        data = '';
    } else {
        switch (typeof(e._data)) {
            case 'object':
                data = e._data.key;
                break;
            case 'string':
                data = e._data;
                break;
        }
    }
    return data;
}


function getActiveTabId () {
    let activeTabId;
    $('.tabs ul li').each(function(){
        if ($(this).hasClass('is-active')) {
            activeTabId = $(this).attr('id');
        }
    });
    return activeTabId;
}


// 윈도우 높이에 따른 컨텐츠 높이 설정
// function setContentHeight () {
//
//     let winH = $(window).height();
//
//     const headerH = 70;
//     let contentH = winH - (headerH + 10);
//
//     let cardHeaderH = $('.card-header').outerHeight();
//     //let cardBodyH = $('.card-body > div').height(); // auto
//
//     let selectAreaH = $('#layout_container > div > div').first().height();
//     //let tabContentH = $('#layout_container > div > div').last().height(); // auto
//
//     let tabAreaH = $('div[wj-part=tabheaders]').height();
//     //let tabPanesH = $('div[wj-part=tabpanes]').height(); // auto
//
//     let inputAreaHeight = $('#formAll').height();
//     let fgToc1H = $('#fgToc1').height();
//     let fgTn1H = $('#fgTn1').height();
//     let fgTp1H = $('#fgTp1').height();
//
//     let fgAllH = contentH - (cardHeaderH + selectAreaH + tabAreaH + inputAreaHeight);
//     $('#fgAll').css('height', fgAllH +'px');
//
//     let fgToc2H = contentH - (cardHeaderH + selectAreaH + tabAreaH + inputAreaHeight + fgToc1H);
//     $('#fgToc2').css('height', fgToc2H +'px');
//
//     let fgTn2H = contentH - (cardHeaderH + selectAreaH + tabAreaH + inputAreaHeight + fgTn1H);
//     $('#fgTn2').css('height', fgTn2H +'px');
//
//     let fgTp2H = contentH - (cardHeaderH + selectAreaH + tabAreaH + inputAreaHeight + fgTp1H);
//     $('#fgTp2').css('height', fgTp2H +'px');
//
// }


// 시료 채취 처리장 필터 처리
function filterBySampleData () {

    let siteList = JSON.parse(mstInfo.siteWithSampleData);
    let checkYN = $('.tabs_content.is-active .search input[type=checkbox]').is(':checked');
    let fg;

    switch (getActiveTabId()) {
        case 'all':
            fg = fgAll; break;
        case 'toc':
            fg = fgToc2; break;
        case 'tn':
            fg = fgTn2; break;
        case 'tp':
            fg = fgTp2; break;
        case 'bod':
            fg = fgBod2; break;
        case 'ss':
            fg = fgSs; break;
        case 'coli':
            fg = fgColi; break;
    }

    if ( checkYN ) {
        // 필터 적용
        fg.collectionView.filter = function (item) {
            let result = false;
            if (item.siteCd.indexOf('SITE') > -1) {
                // 바탕시료는 무조건 true
                result = true;
            } else {

                for (let i = 0; i < siteList.length; i++) {
                    let siteCd = siteList[i].siteCd;
                    if (item.siteCd == siteCd) {
                        result = true;
                    }
                }
            }
            return result;
        }
    } else {
        // 필터 해제
        fg.collectionView.filter = function (item) {
            return true;
        }
    }

    // 스크롤바 영역 새로고침
    fgRefresh(fg, 10);

}


// 팝업 닫기
function closePop (el) {

    if (typeof el != 'string') {
        // 닫기 버튼
        let popId = $(el).parents('.popup_layer').prop('id');
        commonUI.layer_close(popId);

    } else {
        commonUI.layer_close(el);
    }
}


// 추가 채수일자 유효성 체크
function addInputDateChk() {
    let result = true;
    let addInputChk = mstInfo.addInputChk;

    if ( addInputChk == 'Y' ) {

        let addInputDate = mstInfo.addInputDate;
        if (utils.isEmpty(addInputDate)) {
            skec.alert("추가 채수일자를 선택해주세요.")
            result = false;
        }
    }
    return result;
}


// 탭 이동시 데이터 변경 체크
function checkItemChanged ( tabId ) {
    let fg1, originFg1, fg2;

    switch (tabId) {
        case 'all':
            fg2 = fgAll;
            break;
        case 'toc':
            fg1 = fgToc1;
            originFg1 = originFgToc1;
            fg2 = fgToc2;
            break;
        case 'tn':
            fg1 = fgTn1;
            originFg1 = originFgTn1;
            fg2 = fgTn2;
            break;
        case 'tp':
            fg1 = fgTp1;
            originFg1 = originFgTp1;
            fg2 = fgTp2;
            break;
        case 'bod':
            fg1 = fgBod1;
            originFg1 = originFgBod1;
            fg2 = fgBod2;
            fg3 = fgBod3;
            break;
        case 'ss':
            fg2 = fgSs;
            break;
        case 'coli':
            fg2 = fgColi;
            break;
    }

    let result = false;

    if (originMstInfo != JSON.stringify(mstInfo)) {
        result = true;
    }

    if (tabId != 'etc') {

        if (tabId != 'all' && tabId != 'ss' && tabId != 'coli') {

            fg1 = deleteValidateColumn(fg1);
            if ( !utils.isEmpty(originFg1) && originFg1 != JSON.stringify(fg1._cv.items)) {
                result = true;
            }
        }

        fg2 = skec.flexGrid.getChangedItems(deleteValidateColumn(fg2));
        if ( fg2.itemsEdited.length != 0 ) {
            result = true;
        }

    }
    return result;
}



/****************************************************************** 사용자 목록 팝업 ****************************************************************************/
function setMemberPop ( type, _title ) {

    // 타이틀
    let title;
    if ( _title == null ) {
        let officeNm = $('#officeList option:selected').text();
        // 사업소명
        title = '사용자 선택 - ' + officeNm;
    } else {
        // 책임자
        title = _title + ' 선택';
    }
    $('#pop_member h5').text(title);

    // 담당자 또는 결재선 구분
    $('#returnMemberBtn').attr('data-type', type);

    // 해당 사업소 사용자 목록
    let activeOfficeCd = $('#officeList').val();

    // 결재 취소 요청 기능 개선, 20220812, 이미남
    let opt = [];
    if(type == 'cansel'){

        for( let i = 0; i < memberListBySite[activeOfficeCd].length; i++){
            // 전체관리자 선우희건,김형준만 보임.
            if(memberListBySite[activeOfficeCd][i].userId == 'syaea' || memberListBySite[activeOfficeCd][i].userId == 'swhkss' || memberListBySite[activeOfficeCd][i].userId == 'hsy6013' ){
                opt.push(memberListBySite[activeOfficeCd][i]);
            }
            //테스트 용으로 설정
            if ( memberListBySite[activeOfficeCd][i].userId == 'k11429' &&  sessionUserId == 'k11429' )
                opt.push(memberListBySite[activeOfficeCd][i]);

        }
        fgMember._cv.sourceCollection = opt;
    }else{
        fgMember._cv.sourceCollection = memberListBySite[activeOfficeCd];
    }

    // 팝업 오픈
    commonUI.layer_open(this, 'pop_member');
}


function returnMember (name, id) {

    if ( name == null || id == null ) {
        let checkedRow = fgMember.collectionView.currentItem;
        name = checkedRow.userName;
        id = checkedRow.userId;
    }

    let type = $('#returnMemberBtn').attr('data-type');

    if ( type == 'appr' ) {
        // 결재선 지정일 경우
        let row = fgFlowLine.selection.row;
        fgFlowLine.setCellData(row, 1, name);
        fgFlowLine.setCellData(row, 2, id);
    } else if(type == 'cansel'){
        // 결재 취소 요청 기능 개선, 20220812, 이미남
        // 결재 취소 팝업 결재선 지정일 경우
        let row = fgCanselFlowLine.selection.row;
        fgCanselFlowLine.setCellData(row, 1, name);
        fgCanselFlowLine.setCellData(row, 2, id);
    } else {
        // 담당자 선택일 경우
        setTester(type, name, id);
        // 마스터 정보 변경 이벤트
        $('#'+type+'Nm').change();
        $('#'+type+'Id').change();
    }

    // 그리드 초기화
    fgMember._cv.sourceCollection = [];
    //검색어 초기화
    //$('#fgMemberSch').val('');
    fgMember.search.text = "";
    // 팝업 닫기
    closePop('pop_member');
}

let fgMember = skec.flexGrid.init('#fgMember', {
    columns: [
        {
            binding: 'userId',
            header: "사용자 ID",
            align: "center",
            width: "3*",
            isReadOnly: true
        },
        {
            binding: 'userName',
            header: "사용자 이름",
            align: "center",
            width: "3*",
            isReadOnly: true,
            cellTemplate: "" +
                "<a style='color: blue;' href='#', onclick='returnMember( \"${item.userName}\" , \"${item.userId}\" );'>" +
                "   <u style='color: blue;' >${item.userName}</u>" +
                "</a>"
        },
        {
            binding: 'userRoleCd',
            header: '직책',
            align: "center",
            width: "2*",
            isReadOnly: true
        }
    ],
    selectionMode: "Row",
    copying: (s, e) => {
                //hasHeaders = document.getElementById('includeHeaders').checked;
                if (true) {
                    // copy text with headers and copyright notice to clipboard
                    //let text = s.getClipString(null, false, true, false);
                    //text = text + '\r\n(c) 2019 Grapecity Inc';
                    // put text with headers on the clipboard
                    //Clipboard.copy(text);
                    // prevent the grid from overwriting our clipboard content
                    e.cancel = true;
                }
            }
});
fgMember.formatItem.addHandler(function (fg, e) {
        if (fg.editRange) return;
        let item = e.panel.rows[e.row].dataItem;
        if (e.panel == fg.cells) {
            let binding = fg.columns[e.col].binding;
            if (binding == 'userId' ) {
                 if(fg.getCellData(e.row, e.col) != '' && fg.getCellData(e.row, e.col) != null){
                    e.cell.innerHTML = maskingFunc.userid( fg.getCellData(e.row, e.col) ) ;
                 }
            }
            if (binding == 'userName' ) {
                 if(fg.getCellData(e.row, e.col) != '' && fg.getCellData(e.row, e.col) != null){
                    let name = maskingFunc.name( fg.getCellData(e.row, e.col) ) ;
                    let userid = fg.getCellData(e.row, 0, true);
                    e.cell.innerHTML = "<a href='#', onclick='returnMember( \""+name+"\" , \""+userid+"\" );'>" +
                                        "   <u>"+name+"</u>" +
                                        "</a>";
                 }
            }
        }

    })

fgMember.search = new wijmo.grid.search.FlexGridSearch("#fgMemberSch", {
    grid : fgMember,
    placeholder: "Find"
});

//skec.flexGrid.rowChecker(fgMember);

