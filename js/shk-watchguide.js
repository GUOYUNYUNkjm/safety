/* SHine-K 3.0 · 普通智能手表连接说明（小米 / 华为 / 苹果 / 其他）
 * 原理：手表打开“心率广播”后，会像蓝牙心率带一样发出标准心率信号（Heart Rate Service 0x180D），
 * 电脑 Chrome / Edge 通过 Web Bluetooth 直接接收。普通手表只开放心率，不开放加速度原始数据，
 * 所以摔倒仍由摄像头判断，手表负责心率过高 / 过低和信号中断提醒。
 * 资料：华为 consumer.huawei.com 心率广播说明；小米手环心率广播见 github.com/Tnze/miband-heart-rate；
 *       Apple Watch 需 iPhone 广播 App，例如 App Store 的 HeartCast。 */
(function () {
  'use strict';
  window.SHK_WATCH_GUIDE = {
    zh: {
      title: '连接普通智能手表', tabs: { xiaomi: '小米', huawei: '华为 / 荣耀', apple: '苹果', other: '其他品牌' },
      go: '🔍 搜索手表', all: '列表里没有？显示全部蓝牙设备', old: '旧款小米手环 4–7', close: '关闭',
      common: '普通手表只开放心率：心率过高 / 过低、手表信号中断会提醒；摔倒仍由摄像头判断。数据只在这台电脑里处理。',
      xiaomi: [
        '<b>小米手环 8 / 9 / 10、小米手表：</b>在手环上打开 <b>设置 → 心率广播</b>，打开开关（个别型号叫“运动心率广播”）。',
        '<b>小米手环 4–7（旧款）：</b>在手机“小米运动健康”App 的设备页打开<b>运动心率广播</b>，然后在手环上开始一项运动（如户外步行）。',
        '把手环戴紧一点，电脑打开蓝牙，离电脑 10 米以内。',
        '新款点 <b>🔍 搜索手表</b>，选名字里带 Xiaomi / Band 的设备；旧款点 <b>旧款小米手环 4–7</b>。'
      ],
      xiaomi_note: '旧款手环不建立连接，只发广播包，需要在 Chrome 地址栏打开 chrome://flags，启用 “Experimental Web Platform features” 后重启浏览器。',
      huawei: [
        '在手表或手环上打开 <b>设置 → 心率广播</b>，点开关进入广播状态。没有这个选项说明该型号不支持。',
        '也可以开始一项锻炼，锻炼时会继续广播心率。',
        '电脑打开蓝牙，点 <b>🔍 搜索手表</b>，选名字为 HUAWEI WATCH… / HUAWEI Band… / HONOR… 的设备。',
        '连接后手表上会显示已连接；断开时请在手表上关闭心率广播。'
      ],
      huawei_note: '心率广播开启后手表会持续测心率，耗电会变快。',
      apple: [
        'Apple Watch 自己不对电脑开放心率，需要在 iPhone 和手表上装一个<b>心率广播 App</b>，例如 App Store 免费的 <b>HeartCast</b>。',
        '同时打开 iPhone 和手表上的 App，在手表上点<b>开始</b>（开始一次锻炼），iPhone 就会用蓝牙广播心率。',
        'iPhone 保持亮屏、App 在前台，放在电脑旁边。',
        '在<b>电脑</b>的 Chrome / Edge 里点 <b>🔍 搜索手表</b>，选 iPhone 的名字或 HeartCast。'
      ],
      apple_note: 'iPhone 的 Safari 不支持网页蓝牙，所以接收端必须是电脑或安卓手机的 Chrome。Apple Watch 自带的摔倒检测只会通知手表里的紧急联系人，网站读不到。',
      other: [
        '在手表设置里找 <b>心率广播 / 广播心率 / Broadcast HR</b> 并打开：Garmin 在心率设置里，Amazfit、COROS、Polar、Suunto 也有类似选项。',
        '电脑打开蓝牙，点 <b>🔍 搜索手表</b>，选手表的名字。',
        '找不到就点 <b>显示全部蓝牙设备</b>，选手表；如果提示“没有心率服务”，说明心率广播没开。'
      ],
      other_note: '三星 Galaxy Watch、OPPO、vivo 等大多不支持标准心率广播，需要手表上另装广播应用。',
      err_nohr: '{name} 没有心率信号：请先在手表上打开“心率广播”再连接。',
      err_noadv: '这个浏览器不能接收旧款小米手环的广播：请在 chrome://flags 启用 “Experimental Web Platform features”，或改用小米手环 8 以后的型号。',
      lost: '{id} 手表信号中断', lost_say: '{id}的手表信号中断，请检查。'
    },
    ko: {
      title: '일반 스마트워치 연결', tabs: { xiaomi: '샤오미', huawei: '화웨이 / 아너', apple: '애플', other: '기타' },
      go: '🔍 워치 찾기', all: '목록에 없나요? 모든 블루투스 기기 보기', old: '구형 미밴드 4–7', close: '닫기',
      common: '일반 워치는 심박만 공개합니다: 심박 과다 / 과소, 워치 신호 끊김을 알립니다. 넘어짐은 카메라가 판단합니다. 데이터는 이 컴퓨터에서만 처리합니다.',
      xiaomi: [
        '<b>샤오미 스마트밴드 8 / 9 / 10, 샤오미 워치:</b> 밴드에서 <b>설정 → 심박수 브로드캐스트</b>를 켭니다 (일부 모델은 “운동 심박수 공유”).',
        '<b>미밴드 4–7 (구형):</b> 휴대폰 앱(Mi Fitness / Zepp Life)의 기기 화면에서 <b>심박수 공유</b>를 켜고, 밴드에서 운동(예: 걷기)을 시작합니다.',
        '밴드를 조금 꽉 차고, 컴퓨터 블루투스를 켠 뒤 10 m 안에 둡니다.',
        '신형은 <b>🔍 워치 찾기</b>를 눌러 Xiaomi / Band 이름의 기기를 고르고, 구형은 <b>구형 미밴드 4–7</b>을 누릅니다.'
      ],
      xiaomi_note: '구형 밴드는 연결 없이 광고 패킷만 보내므로, Chrome 주소창에서 chrome://flags 의 “Experimental Web Platform features”를 켜고 다시 시작해야 합니다.',
      huawei: [
        '워치/밴드에서 <b>설정 → 심박수 브로드캐스트</b>를 열고 켭니다. 메뉴가 없으면 지원하지 않는 모델입니다.',
        '운동을 시작해도 브로드캐스트가 계속됩니다.',
        '컴퓨터 블루투스를 켜고 <b>🔍 워치 찾기</b>에서 HUAWEI WATCH… / HUAWEI Band… / HONOR… 를 고릅니다.',
        '연결되면 워치에 표시됩니다. 끝낼 때는 워치에서 브로드캐스트를 끕니다.'
      ],
      huawei_note: '브로드캐스트 중에는 계속 심박을 재므로 배터리가 빨리 닳습니다.',
      apple: [
        'Apple Watch는 컴퓨터에 심박을 직접 공개하지 않습니다. iPhone과 워치에 <b>심박 브로드캐스트 앱</b>(예: 무료 <b>HeartCast</b>)을 설치합니다.',
        'iPhone과 워치에서 앱을 열고 워치에서 <b>시작</b>(운동 시작)을 누르면 iPhone이 블루투스로 심박을 보냅니다.',
        'iPhone 화면을 켜 두고 앱을 앞에 둔 채 컴퓨터 옆에 둡니다.',
        '<b>컴퓨터</b> Chrome / Edge에서 <b>🔍 워치 찾기</b>를 눌러 iPhone 이름이나 HeartCast를 고릅니다.'
      ],
      apple_note: 'iPhone Safari는 웹 블루투스를 지원하지 않으므로 받는 쪽은 컴퓨터나 안드로이드 Chrome이어야 합니다. Apple Watch 자체 넘어짐 감지는 긴급 연락처에만 알리며 웹사이트는 읽을 수 없습니다.',
      other: [
        '워치 설정에서 <b>심박 브로드캐스트 / Broadcast HR</b>를 켭니다. Garmin은 심박 설정에 있고, Amazfit, COROS, Polar, Suunto도 비슷한 메뉴가 있습니다.',
        '컴퓨터 블루투스를 켜고 <b>🔍 워치 찾기</b>에서 워치 이름을 고릅니다.',
        '안 보이면 <b>모든 블루투스 기기 보기</b>로 고르세요. “심박 서비스 없음”이 뜨면 브로드캐스트가 꺼져 있는 것입니다.'
      ],
      other_note: '삼성 Galaxy Watch 등은 대부분 표준 심박 브로드캐스트가 없어 별도 앱이 필요합니다.',
      err_nohr: '{name} 심박 신호 없음: 워치에서 “심박수 브로드캐스트”를 먼저 켜고 연결하세요.',
      err_noadv: '이 브라우저는 구형 미밴드 광고를 받을 수 없습니다: chrome://flags 에서 “Experimental Web Platform features”를 켜거나 미밴드 8 이후 모델을 쓰세요.',
      lost: '{id} 워치 신호 끊김', lost_say: '{id} 워치 신호가 끊겼습니다. 확인하세요.'
    },
    en: {
      title: 'Connect a regular smartwatch', tabs: { xiaomi: 'Xiaomi', huawei: 'Huawei / Honor', apple: 'Apple', other: 'Other' },
      go: '🔍 Find watch', all: 'Not listed? Show all Bluetooth devices', old: 'Older Mi Band 4–7', close: 'Close',
      common: 'Regular watches only share heart rate: you get alerts for high / low HR and lost watch signal; falls are still detected by the camera. Data stays on this computer.',
      xiaomi: [
        '<b>Xiaomi Smart Band 8 / 9 / 10, Xiaomi Watch:</b> on the band open <b>Settings → Heart rate broadcast</b> and turn it on (some models call it “Workout HR sharing”).',
        '<b>Mi Band 4–7 (older):</b> in the phone app’s device page turn on <b>heart rate sharing</b>, then start a workout on the band (e.g. outdoor walk).',
        'Wear the band snugly, turn on Bluetooth on the computer, stay within 10 m.',
        'Newer: press <b>🔍 Find watch</b> and pick the Xiaomi / Band device. Older: press <b>Older Mi Band 4–7</b>.'
      ],
      xiaomi_note: 'Older bands only send advertisements, so in Chrome open chrome://flags, enable “Experimental Web Platform features” and restart.',
      huawei: [
        'On the watch or band open <b>Settings → Heart rate broadcast</b> and turn it on. If the item is missing, the model does not support it.',
        'You can also start a workout; broadcasting continues during it.',
        'Turn on Bluetooth on the computer, press <b>🔍 Find watch</b>, pick HUAWEI WATCH… / HUAWEI Band… / HONOR….',
        'The watch shows it is connected. To stop, turn the broadcast off on the watch.'
      ],
      huawei_note: 'Broadcasting keeps the HR sensor on, so the battery drains faster.',
      apple: [
        'Apple Watch does not share heart rate with computers by itself. Install a <b>heart-rate broadcast app</b> on iPhone and watch, e.g. the free <b>HeartCast</b>.',
        'Open the app on both, press <b>Start</b> (start a workout) on the watch; the iPhone then broadcasts heart rate over Bluetooth.',
        'Keep the iPhone screen on with the app in front, next to the computer.',
        'On the <b>computer</b> in Chrome / Edge press <b>🔍 Find watch</b> and pick the iPhone’s name or HeartCast.'
      ],
      apple_note: 'Safari on iPhone has no Web Bluetooth, so the receiver must be Chrome on a computer or Android. Apple Watch’s own fall detection only notifies its emergency contacts; websites cannot read it.',
      other: [
        'In the watch settings turn on <b>Broadcast heart rate</b>: Garmin has it under heart rate settings; Amazfit, COROS, Polar and Suunto have similar options.',
        'Turn on Bluetooth on the computer, press <b>🔍 Find watch</b>, pick the watch.',
        'If it is missing use <b>Show all Bluetooth devices</b>. “No heart rate service” means broadcasting is off.'
      ],
      other_note: 'Samsung Galaxy Watch, OPPO, vivo and similar mostly lack standard HR broadcast and need an extra app on the watch.',
      err_nohr: '{name} has no heart rate signal: turn on “Heart rate broadcast” on the watch first.',
      err_noadv: 'This browser cannot receive older Mi Band advertisements: enable “Experimental Web Platform features” in chrome://flags, or use Band 8 or newer.',
      lost: '{id} watch signal lost', lost_say: '{id} watch signal lost. Please check.'
    }
  };
})();
