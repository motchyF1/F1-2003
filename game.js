/* =================================================================
   ゲームの心臓部 (game.js)
================================================================= */

// ----------------------------------------------------------------
// 1. グローバル変数
// ----------------------------------------------------------------
let playerTeam;
let aiTeams = [];
let currentRaceIndex = 0; // 今、第何戦か
const POINTS_SYSTEM = { 1: 10, 2: 8, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1 };

/**
 * 予選の結果を、決勝レースに渡すための「一時的な箱」です
 */
let currentQualiResults = [];

// HTMLの「どこに」表示するか
const titleElement = document.getElementById("screen-title");
const contentElement = document.getElementById("screen-content");

// ----------------------------------------------------------------
// ★★★ お助け関数 (Utility) をここに移動！ ★★★
// ----------------------------------------------------------------

/**
 * チームステータス表示のお助け関数
 * (★常に安定感も表示するように修正！)
 * @param {string} elementId 表示する場所のID
 * @param {boolean} showFull ドライバー名なども全部表示するならtrue
 */
function updateTeamStatusDisplay(elementId, showFull) {
    const targetElement = document.getElementById(elementId);
    if (!targetElement) return;

    let html = "<hr>";
    html += "<p><b>資金:</b> " + playerTeam.money + "万ドル</p>";

    if (showFull) {
        html += "<h3>現在のチーム状況 (" + (playerTeam.teamName || "未定") + ")</h3>" + // チーム名がない場合も考慮
                "<p><b>ベースマシン:</b> " + (playerTeam.chassis ? playerTeam.chassis.name : "未選択") +
                " (タイヤ: " + (playerTeam.tyre || "未選択") + ")</p>" +
                "<p><b>エンジン:</b> " + (playerTeam.engine ? playerTeam.engine.name : "未選択") + "</p>" +
                "<p><b>ドライバー1:</b> " + (playerTeam.driver1 ? playerTeam.driver1.name : "未契約") + "</p>" +
                "<p><b>ドライバー2:</b> " + (playerTeam.driver2 ? playerTeam.driver2.name : "未契約") + "</p>";
    }

    html += "<h4><b>マシン" + (showFull ? "初期" : "現在") + "スペック</b></h4>";
    // currentSpecがない場合も考慮
    const spec = playerTeam.currentSpec || {};
    html += "<p>ストレートスピード: " + (spec.straight !== undefined ? spec.straight : 'N/A') + "</p>" +
            "<p>コーナリングスピード: " + (spec.cornering !== undefined ? spec.cornering : 'N/A') + "</p>" +
            "<p>信頼性: " + (spec.reliability !== undefined ? spec.reliability : 'N/A') + "</p>" +
            "<p>安定感: " + (spec.stability !== undefined ? spec.stability : 'N/A') + "</p>"; // 常に表示

    targetElement.innerHTML = html;
}

/**
 * 重み付きランダム抽選のお助け関数
 */
function getRandomWeightedChoice(choices) {
    // ★choices が空でないか、オブジェクトであるかを確認
    if (!choices || typeof choices !== 'object' || Object.keys(choices).length === 0) {
        console.error("getRandomWeightedChoice: 無効な choices オブジェクトです:", choices);
        return null; // または適切なデフォルト値/エラー処理
    }
    const rand = Math.random();
    let cumulativeProbability = 0;
    for (const choice in choices) {
        // ★確率が数値であるか確認
        if (typeof choices[choice] === 'number' && choices[choice] >= 0) {
            cumulativeProbability += choices[choice];
            if (rand < cumulativeProbability) {
                return choice;
            }
        } else {
             console.warn("getRandomWeightedChoice: 無効な確率:", choice, choices[choice]);
        }
    }
    // 合計確率が1未満の場合や計算誤差でここまで来た場合、最後の有効な選択肢を返す
     const validChoices = Object.keys(choices).filter(key => typeof choices[key] === 'number' && choices[key] >= 0);
     if (validChoices.length > 0) {
          console.warn("getRandomWeightedChoice: 累計確率が1未満か計算誤差の可能性があります。最後の有効な選択肢を返します。");
          return validChoices[validChoices.length - 1];
     } else {
          console.error("getRandomWeightedChoice: 有効な選択肢が一つもありませんでした。");
          return null;
     }
}
// ★★★ お助け関数の移動ここまで ★★★

// ----------------------------------------------------------------
// 2. ゲームの起動処理
// ----------------------------------------------------------------
function initializeGame() {
    console.log("ゲーム起動！ (initializeGame)");
    playerTeam = new PlayerTeam();

    // AIチームのデータを作る (年間ポイント points: 0 を追加)
    aiTeams = [
        { machine: EXISTING_MACHINES.ferrari, driver1: EXISTING_DRIVERS[0], driver2: EXISTING_DRIVERS[1], points: 0 },
        { machine: EXISTING_MACHINES.williams, driver1: EXISTING_DRIVERS[2], driver2: EXISTING_DRIVERS[3], points: 0 },
        { machine: EXISTING_MACHINES.mclaren, driver1: EXISTING_DRIVERS[4], driver2: EXISTING_DRIVERS[5], points: 0 },
        { machine: EXISTING_MACHINES.renault, driver1: EXISTING_DRIVERS[6], driver2: EXISTING_DRIVERS[7], points: 0 },
        { machine: EXISTING_MACHINES.sauber, driver1: EXISTING_DRIVERS[8], driver2: EXISTING_DRIVERS[9], points: 0 },
        { machine: EXISTING_MACHINES.jordan, driver1: EXISTING_DRIVERS[10], driver2: EXISTING_DRIVERS[11], points: 0 },
        { machine: EXISTING_MACHINES.jaguar, driver1: EXISTING_DRIVERS[12], driver2: EXISTING_DRIVERS[13], points: 0 },
        { machine: EXISTING_MACHINES.bar, driver1: EXISTING_DRIVERS[14], driver2: EXISTING_DRIVERS[15], points: 0 },
        { machine: EXISTING_MACHINES.minardi, driver1: EXISTING_DRIVERS[16], driver2: EXISTING_DRIVERS[17], points: 0 },
        { machine: EXISTING_MACHINES.toyota, driver1: EXISTING_DRIVERS[18], driver2: EXISTING_DRIVERS[19], points: 0 }
    ];

    // AIドライバーのフィニッシュ回数とポイントを初期化
    EXISTING_DRIVERS.forEach(driver => {
        driver.finishes = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        driver.points = 0;
        // ★所属チーム情報もここで設定するのが確実！
        const teamData = aiTeams.find(t => (t.driver1 && t.driver1.id === driver.id) || (t.driver2 && t.driver2.id === driver.id));
        driver.team = teamData ? teamData.machine.name : null;
    });

    // 最初の画面は「チーム名入力」から！
    showTeamNameScreen();

}

/* =================================================================
   ロードマップ 2 & 3: チーム立ち上げフェーズ
================================================================= */

/**
 * ★NEW!★ ロードマップ 2-0: チーム名入力画面
 */
function showTeamNameScreen() {
    console.log("チーム名入力画面を表示します");
    titleElement.textContent = "チーム名登録";
    contentElement.innerHTML = ""; 
    
    contentElement.innerHTML = 
        "<p>チーム名を入力してください</p>" +
        "<input type='text' id='team-name-input' value='フェニックス・グランプリ' style='font-size: 16px; padding: 5px; width: 300px;'>" +
        "<br><br>" +
        "<button id='team-name-submit'>エントリー</button>";
    
    // ボタンに関数を割り当てます
    document.getElementById("team-name-submit").onclick = function() {
        const inputName = document.getElementById("team-name-input").value;
        if (inputName.trim() === "") {
            alert("チーム名を入力してください！");
        } else {
            selectTeamName(inputName);
        }
    };
}

/**
 * ★NEW!★ チーム名が決定された時の関数
 */
function selectTeamName(name) {
    playerTeam.teamName = name;
    console.log("「" + name + "」のエントリーが受理されました");
    // ステップ1（シャシー選択）に進みます
    showChassisSelectionScreen();
}


/**
 * ロードマップ 2-1: シャシー選択画面
 */
function showChassisSelectionScreen() {
    console.log("シャシー選択画面を表示します");
    titleElement.textContent = "シャシー選択";
    contentElement.innerHTML = ""; 
    
    const description = document.createElement("p");
    description.textContent = "あなたのチームのマシンのベースにするシャシーを選んでください";
    contentElement.appendChild(description);

    // 選択肢（シャシー3台）
    const chassisOptions = [
        PLAYER_CHASSIS_OPTIONS.prost,
        PLAYER_CHASSIS_OPTIONS.arrows,
        PLAYER_CHASSIS_OPTIONS.honda
    ];
    
    chassisOptions.forEach(chassis => {
        const btn = document.createElement("button");
        btn.className = "choice-button";
        btn.innerHTML = chassis.name + "<br>" +
            "(ストレートスピード:" + chassis.straight +
            ", コーナリングスピード:" + chassis.cornering +
            ", 信頼性:" + chassis.reliability +
            ", 安定感:" + chassis.stability + ")";
        
        btn.onclick = function() {
            selectChassis(chassis);
        };
        contentElement.appendChild(btn);
    });
}

/**
 * シャシー選択ボタンが押された時
 */
function selectChassis(selectedChassis) {
    playerTeam.chassis = selectedChassis;
    console.log(selectedChassis.name + " が選ばれました");
    showTyreSelectionScreen(); 
}

/**
 * ロードマップ 2-2: タイヤ選択画面
 */
function showTyreSelectionScreen() {
    console.log("タイヤ選択画面を表示します");
    titleElement.textContent = "タイヤサプライヤー選択";
    contentElement.innerHTML = ""; 
    
    contentElement.innerHTML = 
        "<p>契約するタイヤサプライヤーを2社から選んでください（無料です）</p>" +
        "<button id='tyre-bs' class='choice-button'>ブリヂストン (Bridgestone)<br>" +
        "※雨(20%の確率で発生)ではコーナリングスピード +3</button>" +
        "<button id='tyre-mi' class='choice-button'>ミシュラン (Michelin)<br>" +
        "※第2戦マレーシアGP / 第13戦ハンガリーGP ではコーナリングスピード +3</button>";

    document.getElementById("tyre-bs").onclick = function() { selectTyre("Bridgestone"); };
    document.getElementById("tyre-mi").onclick = function() { selectTyre("Michelin"); };
}

/**
 * タイヤ選択ボタンが押された時
 */
function selectTyre(selectedTyre) {
    playerTeam.tyre = selectedTyre;
    playerTeam.chassis.tyre = selectedTyre;
    console.log(selectedTyre + " が選ばれました");
    showEngineSelectionScreen();
}

/**
 * ロードマップ 2-3: エンジン選択画面
 * (★割引紹介文を discountText から表示するように修正)
 */
function showEngineSelectionScreen() {
    console.log("エンジン選択画面を表示します");
    titleElement.textContent = "エンジンサプライヤー契約";
    contentElement.innerHTML = ""; 
    
    const description = document.createElement("p");
    description.textContent = "契約するエンジンを選んでください（" + playerTeam.year + "年目に契約可能なエンジンのみ表示されます）";
    contentElement.appendChild(description);

    const availableEngines = ENGINE_OPTIONS.filter(engine => engine.availabilityYear <= playerTeam.year);

    availableEngines.forEach(engine => {
        const btn = document.createElement("button");
        btn.className = "choice-button";
        
        let engineInfo = engine.name + "<br>" +
            "(ストレートへの影響:" + engine.straightBonus +
            ", コーナリングへの影響:" + engine.corneringBonus +
            ", 信頼性への影響:" + engine.reliabilityBonus + ")<br>" +
            "【価格】: " + engine.price + "万ドル";
            
        // ★NEW!★ 割引紹介文 (discountText) があれば、それをそのまま表示
        if (engine.restriction && engine.restriction.discountText) {
            // <small> タグで少し小さく表示します
            engineInfo += "<br><small>" + engine.restriction.discountText + "</small>";
        }
        
        btn.innerHTML = engineInfo;
        
        btn.onclick = function() {
            selectEngine(engine);
        };
        contentElement.appendChild(btn);
    });
}

/**
 * エンジン選択ボタンが押された時
 */
function selectEngine(selectedEngine) {
    if (playerTeam.money < selectedEngine.price) {
        alert("資金が足りません！\n" + selectedEngine.name + " は契約できません");
        return;
    }
    
    playerTeam.money -= selectedEngine.price;
    playerTeam.engine = selectedEngine;
    console.log(selectedEngine.name + " を契約しました。残り資金: " + playerTeam.money + "万ドル");

    playerTeam.calculateInitialSpec();
    
    showDriverSelectionScreen();
}

/**
 * ロードマップ 3: ドライバー契約画面
 */
function showDriverSelectionScreen() {
    const driverCountText = (playerTeam.driver1 === null) ? "1人目" : "2人目";
    console.log("ドライバー契約画面 (" + driverCountText + ") を表示します");
    
    titleElement.textContent = "ドライバー契約 (" + driverCountText + " / 2人)";
    contentElement.innerHTML = ""; 
    
    contentElement.innerHTML = "<p>獲得可能ドライバーリストから、契約するドライバーを選んでください（契約は1年単位です）</p>";

    const driverListContainer = document.createElement("div");
    driverListContainer.className = "driver-list-container";
    
    AVAILABLE_DRIVERS.forEach(driver => {
        if (playerTeam.driver1 && playerTeam.driver1.id === driver.id) {
            return;
        }

        const btn = document.createElement("button");
        btn.className = "driver-button";
        
        // ★★★ ここからが修正箇所です！ ★★★
        let abilityTexts = []; // 特殊能力のテキストを入れる箱

        // 1. 開発ボーナス
        if (driver.specialAbilityCode === 'DEV_UP') {
            abilityTexts.push("マシン開発効果アップ");
        }
        
        // 2. レースボーナス
        if (driver.specialAbilityCode === 'RACE_BONUS_JP') {
            abilityTexts.push("日本GPで速さ+5");
        } 
        // ★NEW!★ アメリカGPボーナス
        else if (driver.specialAbilityCode === 'RACE_BONUS_US') {
            abilityTexts.push("アメリカGPで速さ+10");
        }
        // ★★★ 修正ここまで ★★★


        // 3. エンジン割引 (ドライバーIDで判定)
        const driverId = driver.id;
        if (driverId === "massa" || driverId === "badoer") {
            abilityTexts.push("起用するとフェラーリエンジン割引");
        } else if (driverId === "sato" || driverId === "fukuda" || driverId === "kaneishi") {
            abilityTexts.push("起用するとホンダエンジン割引");
        } else if (driverId === "takagi" || driverId === "briscoe" || driverId === "zonta") {
            abilityTexts.push("起用するとトヨタエンジン割引");
        }
        
        // 4. エンジン割引 (国籍で判定)
        if (driver.nationality === "ドイツ") {
            abilityTexts.push("起用するとBMWエンジン割引");
        }

        // 5. ぜんぶ合体させて、表示用のテキストを作る
        let abilityDisplay = "";
        if (abilityTexts.length > 0) {
            abilityDisplay = " <small>[" + abilityTexts.join(", ") + "]</small>";
        }

        btn.innerHTML = "<b>" + driver.name + "</b> (" + driver.nationality + ") " + abilityDisplay + "<br>" + 
            "予選速さ:" + driver.qs + 
            " / 決勝速さ:" + driver.rs + 
            " / 信頼性:" + driver.reliability + 
            " / 安定感:" + driver.stability + "<br>" +
            "<b>【年俸】: " + driver.salary + "万ドル</b>";
        
        btn.onclick = function() {
            if (driver.salary > 0 && playerTeam.money < driver.salary) {
                alert("資金が足りません！\n" + driver.name + " とは契約できません");
            } else {
                selectDriver(driver);
            }
        };
        driverListContainer.appendChild(btn);
    });
    
    contentElement.appendChild(driverListContainer);
}

/**
 * ドライバー選択ボタンが押された時
 */
function selectDriver(selectedDriver) {
    playerTeam.money -= selectedDriver.salary;
    
    if (playerTeam.driver1 === null) {
        playerTeam.driver1 = selectedDriver;
        console.log("1人目: " + selectedDriver.name + " と契約しました。");
        showDriverSelectionScreen();
    } else {
        playerTeam.driver2 = selectedDriver;
        console.log("2人目: " + selectedDriver.name + " と契約しました。");
        
        checkEngineDiscount();
        
        // チーム立ち上げ完了！
        showPreSeasonScreen(); 
    }
}

/**
 * エンジンの割引（縛り）をチェック
 */
function checkEngineDiscount() {
    const engine = playerTeam.engine;
    if (!engine.restriction) return;

    const d1 = playerTeam.driver1;
    const d2 = playerTeam.driver2;
    const originalPrice = engine.price;
    const discountPrice = engine.restriction.discountPrice;
    
    let isDiscountApplied = false;

    if (engine.restriction.drivers) {
        const targetDriverIDs = engine.restriction.drivers;
        if (targetDriverIDs.includes(d1.id) || targetDriverIDs.includes(d2.id)) {
            isDiscountApplied = true;
        }
    } else if (engine.restriction.nationality) {
        const targetNationality = engine.restriction.nationality;
        if (d1.nationality === targetNationality || d2.nationality === targetNationality) {
            isDiscountApplied = true;
        }
    }

    if (isDiscountApplied) {
        const refundAmount = originalPrice - discountPrice;
        playerTeam.money += refundAmount;
        console.log("エンジン割引適用！ " + refundAmount + "万ドルが返金されました。");
        
        alert("エンジン値引き！\n" +
              "「" + engine.name + "」の値引き条件を満たしました\n" +
              refundAmount + "万ドルがチームに返金されます！\n\n" +
              "現在の資金: " + playerTeam.money + "万ドル");
    }
}

/* =================================================================
   ロードマップ 4: 開幕前フェーズ
================================================================= */

/**
 * 4-1. 開幕前フェーズのメイン画面
 */
function showPreSeasonScreen() {
    console.log("開幕前フェーズ画面を表示します (" + playerTeam.year + "年目)");
    titleElement.textContent = "開幕前フェーズ (" + playerTeam.year + "年目)";
    contentElement.innerHTML = ""; // まず画面を空にする

    // --- HTML要素を個別に作成 ---
    const p1 = document.createElement("p");
    // ★チーム名がない場合も考慮
    p1.innerHTML = "<b>" + (playerTeam.teamName || "あなたのチーム") + "</b> " + playerTeam.year + "年目のシーズンに向けて準備を整えましょう";
    contentElement.appendChild(p1);

    // スポンサーボタン作成
    const sponsorBtn = document.createElement("button");
    sponsorBtn.id = 'sponsor-btn'; // IDを設定
    sponsorBtn.textContent = "① 開幕前スポンサー抽選を行う";
    contentElement.appendChild(sponsorBtn);

    // 開発ボタン作成
    const developBtn = document.createElement("button");
    developBtn.id = 'develop-btn'; // IDを設定
    developBtn.textContent = "② 開幕前開発に進む (全 20 ターン)";
    developBtn.disabled = true; // 最初は押せないように
    contentElement.appendChild(developBtn);

    // ステータス表示用の div を作成
    const statusDiv = document.createElement("div");
    statusDiv.id = "team-status-display";
    statusDiv.style.marginTop = "15px";
    contentElement.appendChild(statusDiv);

    // スポンサー結果表示用の div を作成
    const sponsorResultsDiv = document.createElement("div");
    sponsorResultsDiv.id = "sponsor-results";
    sponsorResultsDiv.style.marginTop = "15px";
    contentElement.appendChild(sponsorResultsDiv);
    // --- HTML要素作成ここまで ---

    // ★★★ ボタンに関数を割り当てるのは、要素を画面に追加した後！ ★★★
    sponsorBtn.onclick = function() {
        executeSponsorLottery(playerTeam.year); // スポンサー抽選実行
        sponsorBtn.disabled = true; // ボタンを押せなくする
        sponsorBtn.textContent = "① スポンサー抽選 完了！";
        // ★開発ボタンを押せるようにする！
        developBtn.disabled = false;
    };

    developBtn.onclick = function() {
        // 開幕前開発 (20ターン) へ進む
        showDevelopmentScreen(true, 20);
    };
    // ★★★ 関数割り当てここまで ★★★

    // 最初のチーム情報を表示
    updateTeamStatusDisplay("team-status-display", true);
}

/**
 * 4-2. スポンサー抽選を実行する
 * (★年数によって確率が変わるように修正！)
 * @param {number} currentYear 現在の年数
 */
function executeSponsorLottery(currentYear) {
    console.log(currentYear + "年目のスポンサー抽選を実行します");

    let totalSponsorMoney = 0;
    let lotteryResultsHTML = "<h3>スポンサー抽選結果 (" + currentYear + "年目)</h3><ul>"; // ★年数を追加

    // ★年数に応じて確率を決定！ (優勝経験はまだ見てません！)
    let probabilities;
    if (currentYear === 1) {
        probabilities = SPONSOR_PROB_YEAR_1;
    } else {
        // ★本当はここで「優勝経験があるか」で確率を変えますが、
        // 　まだ優勝フラグを作ってないので、ひとまず「優勝なし」の確率を使います！
        probabilities = SPONSOR_PROB_YEAR_2_NO_WIN;
        console.log("（仮：2年目以降・優勝なし の確率を使用中）");
    }

    SPONSOR_INDUSTRIES.forEach(industry => {
        const rank = getRandomWeightedChoice(probabilities);
        const money = SPONSOR_RANKS[rank];
        totalSponsorMoney += money;
        lotteryResultsHTML += "<li><b>" + industry + ":</b> " + rank + "ランク スポンサー獲得！ (+" + money + "万ドル)</li>";
    });

    lotteryResultsHTML += "</ul><h3>合計獲得金額: " + totalSponsorMoney + "万ドル</h3>";

    playerTeam.money += totalSponsorMoney;
    playerTeam.sponsorMoney = totalSponsorMoney; // 今シーズンの獲得額として保存

    console.log(totalSponsorMoney + "万ドル獲得。現在の総資金: " + playerTeam.money);

    document.getElementById("sponsor-results").innerHTML = lotteryResultsHTML;
    updateTeamStatusDisplay("team-status-display", true);
}

/**
 * 4-3 & 5-5. 開発画面（開幕前 / シーズン中）
 * (★アイテム購入機能のロジックを実装！)
 * (★アイテム完売時の innerHTML += バグを修正！)
 * @param {boolean} isPreSeason 開幕前ならtrue
 * @param {number} turns 開発できる回数
 */
function showDevelopmentScreen(isPreSeason, turns) {
    playerTeam.developmentTurnsLeft = turns;
    
    const title = isPreSeason ? "開幕前開発" : "シーズン中開発";
    console.log(title + "画面を表示 (残り " + turns + " ターン)");
    
    titleElement.textContent = title + " (残り " + turns + " ターン)";
    contentElement.innerHTML = "";
    
    let descriptionHTML = "<p>「開発」または「アイテム購入」を実行すると、1ターンを消費します</p>";
    if (isPreSeason) {
        descriptionHTML += "<p>開発ターンが 0 になると、開幕戦に進みます</p>";
    } else {
        descriptionHTML += "<p>開発ターンが 0 になると、「" + RACE_CALENDAR[currentRaceIndex].name + "」の予選に進みます</p>";
    }
    
    let devDriverCount = 0;
    if (playerTeam.driver1.specialAbilityCode === 'DEV_UP') devDriverCount++;
    if (playerTeam.driver2.specialAbilityCode === 'DEV_UP') devDriverCount++;
    descriptionHTML += "<p><b>開発効果アップボーナス:</b> " + devDriverCount + "人 (大成功確率: ";
    if (devDriverCount === 0) descriptionHTML += "5%)";
    else if (devDriverCount === 1) descriptionHTML += "15%)";
    else descriptionHTML += "25%)";
    descriptionHTML += "</p>";
    
    contentElement.innerHTML = descriptionHTML;

    // ① コツコツ開発ボタン
    contentElement.appendChild(document.createElement("hr"));
    contentElement.appendChild(document.createElement("h4")).textContent = "① 通常開発 (1ターン消費)";
    const straightBtn = document.createElement("button");
    straightBtn.innerHTML = "ストレートスピード開発<br>(コスト: " + DEVELOPMENT_COST + "万ドル)";
    straightBtn.onclick = function() { executeDevelopment("straight", devDriverCount, isPreSeason); };
    contentElement.appendChild(straightBtn);
    // (他3つの開発ボタン)
    const cornerBtn = document.createElement("button");
    cornerBtn.innerHTML = "コーナリングスピード開発<br>(コスト: " + DEVELOPMENT_COST + "万ドル)";
    cornerBtn.onclick = function() { executeDevelopment("cornering", devDriverCount, isPreSeason); };
    contentElement.appendChild(cornerBtn);
    const reliabilityBtn = document.createElement("button");
    reliabilityBtn.innerHTML = "信頼性開発<br>(コスト: " + DEVELOPMENT_COST + "万ドル)";
    reliabilityBtn.onclick = function() { executeDevelopment("reliability", devDriverCount, isPreSeason); };
    contentElement.appendChild(reliabilityBtn);
    const stabilityBtn = document.createElement("button");
    stabilityBtn.innerHTML = "安定感開発<br>(コスト: " + DEVELOPMENT_COST + "万ドル)";
    stabilityBtn.onclick = function() { executeDevelopment("stability", devDriverCount, isPreSeason); };
    contentElement.appendChild(stabilityBtn);

    // ★★★ ② アイテム購入 ★★★
    contentElement.appendChild(document.createElement("hr"));
    contentElement.appendChild(document.createElement("h4")).textContent = "② 特別アイテム購入 (1ターン消費 / 各1回のみ)";

    // まだ購入していないアイテムだけをリストアップ
    const availableItems = SPECIAL_ITEMS_SHOP.filter(item => {
        if (!playerTeam.purchasedItemIds) {
            playerTeam.purchasedItemIds = []; 
        }
        return !playerTeam.purchasedItemIds.includes(item.id);
    });

    // ★★★ ここが修正箇所です！ ★★★
    if (availableItems.length === 0) {
        // contentElement.innerHTML += ... を使うと、
        // 先に appendChild した開発ボタンの onclick が消えちゃう！
        // だから、ここも appendChild を使います！
        const noItemsText = document.createElement("p");
        noItemsText.textContent = "購入可能な特別アイテムはもうありません";
        contentElement.appendChild(noItemsText);
    } else {
        // ★★★ 修正ここまで ★★★
        
        // アイテムボタンを作成
        availableItems.forEach(item => {
            const itemBtn = document.createElement("button");
            itemBtn.className = "driver-button"; 

            let effectsText = [];
            if (item.effects.straight > 0) effectsText.push("ストレート +" + item.effects.straight);
            else if (item.effects.straight < 0) effectsText.push("ストレート " + item.effects.straight);
            
            if (item.effects.cornering > 0) effectsText.push("コーナリング +" + item.effects.cornering);
            else if (item.effects.cornering < 0) effectsText.push("コーナリング " + item.effects.cornering);

            if (item.effects.reliability > 0) effectsText.push("信頼性 +" + item.effects.reliability);
            else if (item.effects.reliability < 0) effectsText.push("信頼性 " + item.effects.reliability);

            if (item.effects.stability > 0) effectsText.push("安定感 +" + item.effects.stability);
            else if (item.effects.stability < 0) effectsText.push("安定感 " + item.effects.stability);

            itemBtn.innerHTML = "<b>" + item.name + "</b>  (" + effectsText.join(", ") + ")<br>" +
                              "<b>コスト: " + item.cost + "万ドル</b>";
            
            if (playerTeam.money < item.cost) {
                itemBtn.disabled = true;
                itemBtn.innerHTML += " <small style='color: red;'>(資金不足)</small>";
            }

            itemBtn.onclick = function() {
                executeItemPurchase(item, isPreSeason); 
            };
            contentElement.appendChild(itemBtn);
        });
    }
    // ★★★ アイテム購入ここまで ★★★

    // ③ スキップ
    contentElement.appendChild(document.createElement("hr"));
    contentElement.appendChild(document.createElement("h4")).textContent = "③ スキップ";
    const skipBtn = document.createElement("button");
    skipBtn.innerHTML = "開発をスキップする<br>(1ターン消費)";
    skipBtn.onclick = function() { 
        playerTeam.developmentTurnsLeft--;
        if (playerTeam.developmentTurnsLeft > 0) {
            showDevelopmentScreen(isPreSeason, playerTeam.developmentTurnsLeft);
        } else {
            if (isPreSeason) {
                alert("残り開発ターンが 0 になりました！\nいよいよシーズン開幕です！");
                showSeasonScreen(); // 開幕戦へ
            } else {
                console.log("シーズン中開発終了。予選へ");
                runQualifyingSimulation(); // ★直接予選へ！
            }
        }
    };
    contentElement.appendChild(skipBtn);
    
    // 現在のチーム情報
    const statusDiv = document.createElement("div");
    statusDiv.id = "development-status-display";
    contentElement.appendChild(statusDiv);
    updateTeamStatusDisplay("development-status-display", false);
}

/**
 * ★NEW!★ 4-4 & 5-6 (アイテム購入版). 
 * 特別アイテムの購入を「実行」する
 * (1ターン消費, 1回のみ, 上限/下限チェック)
 * @param {object} item - 購入するアイテム (SPECIAL_ITEMS_SHOP の要素)
 * @param {boolean} isPreSeason 開幕前ならtrue
 */
function executeItemPurchase(item, isPreSeason) {
    // 念のため、お金と購入済みリストを再チェック
    if (playerTeam.money < item.cost) {
        alert("エラー: 資金が足りません！");
        return;
    }
    if (!playerTeam.purchasedItemIds) { // (万が一、箱がなかったら作る)
        playerTeam.purchasedItemIds = [];
    }
    if (playerTeam.purchasedItemIds.includes(item.id)) {
        alert("エラー: そのアイテムは既に購入済みです！");
        return;
    }

    // お金とターンを消費
    playerTeam.money -= item.cost;
    playerTeam.developmentTurnsLeft--;
    
    // 「売り切れ」リストに追加
    playerTeam.purchasedItemIds.push(item.id);

    console.log("アイテム「" + item.name + "」を購入。コスト: " + item.cost + "万ドル。残り資金: " + playerTeam.money);

    // 能力値の変動 (上限100 / 下限0)
    let alertMessage = "「" + item.name + "」を購入！ (1ターン消費)\n";
    const spec = playerTeam.currentSpec; // 短縮
    const effects = item.effects; // 短縮

    // (Math.max(0, ...) で下限0, Math.min(100, ...) で上限100 を保証)
    if (effects.straight !== 0) {
        const oldVal = spec.straight;
        spec.straight = Math.max(0, Math.min(100, oldVal + effects.straight));
        alertMessage += "\nストレート: " + oldVal + " → " + spec.straight + " (" + (effects.straight > 0 ? "+" : "") + effects.straight + ")";
    }
    if (effects.cornering !== 0) {
        const oldVal = spec.cornering;
        spec.cornering = Math.max(0, Math.min(100, oldVal + effects.cornering));
        alertMessage += "\nコーナリング: " + oldVal + " → " + spec.cornering + " (" + (effects.cornering > 0 ? "+" : "") + effects.cornering + ")";
    }
    if (effects.reliability !== 0) {
        const oldVal = spec.reliability;
        spec.reliability = Math.max(0, Math.min(100, oldVal + effects.reliability));
        alertMessage += "\n信頼性: " + oldVal + " → " + spec.reliability + " (" + (effects.reliability > 0 ? "+" : "") + effects.reliability + ")";
    }
    if (effects.stability !== 0) {
        const oldVal = spec.stability;
        spec.stability = Math.max(0, Math.min(100, oldVal + effects.stability));
        alertMessage += "\n安定感: " + oldVal + " → " + spec.stability + " (" + (effects.stability > 0 ? "+" : "") + effects.stability + ")";
    }

    alert(alertMessage);
    console.log(alertMessage);

    // ターン終了後の処理 (executeDevelopment と同じ)
    if (playerTeam.developmentTurnsLeft > 0) {
        showDevelopmentScreen(isPreSeason, playerTeam.developmentTurnsLeft);
    } else {
        if (isPreSeason) {
            alert("残り開発ターンが 0 になりました！\nいよいよシーズン開幕です！");
            showSeasonScreen();
        } else {
            console.log("シーズン中開発終了。予選へ");
            runQualifyingSimulation();
        }
    }
}

/**
 * 4-4 & 5-6. 開発を「実行」する
 * (★上限(100)チェックを関数の最初に移動＆強化！)
 * @param {string} type "straight", "cornering", "reliability", "stability" のどれか
 * @param {number} devDriverCount 開発ボーナスドライバーの人数
 * @param {boolean} isPreSeason 開幕前ならtrue
 */
function executeDevelopment(type, devDriverCount, isPreSeason) {
    // ★★★ 上限チェックを一番最初に移動！ ★★★
    // 開発しようとしている能力値が既に100以上なら、お金もターンも消費せず終了
    if (playerTeam.currentSpec[type] >= 100) {
        alert("「" + type + "」は既に上限(100)に達しています！");
        console.log(type + " は既に上限なので開発しません。");
        // ★重要：ここで return して関数を終了させる！
        return;
    }
    // ★★★ チェックここまで ★★★

    // お金が足りるかチェック (上限チェックの後！)
    if (playerTeam.money < DEVELOPMENT_COST) {
        alert("資金が足りません！ 開発できませんでした");
        return;
    }

    // お金とターンを消費
    playerTeam.money -= DEVELOPMENT_COST;
    playerTeam.developmentTurnsLeft--;

    // 確率決定
    let probabilities;
    if (devDriverCount === 0) probabilities = DEV_PROB_0;
    else if (devDriverCount === 1) probabilities = DEV_PROB_1;
    else probabilities = DEV_PROB_2;

    let result = "";
    let alertMessage = "";
    let actualIncrease = 0; // 実際に増えた値
    let initialValue = playerTeam.currentSpec[type]; // 計算前の値を保存

    if (type === "stability") {
        const stabilityProb = { "great": probabilities.great, "normal": probabilities.normal + probabilities.tradeoff };
        result = getRandomWeightedChoice(stabilityProb);
        if (result === "great") actualIncrease = 3;
        else actualIncrease = 1;

        // ★加算後の値が100を超えないように Math.min を使う！
        const newValue = Math.min(100, initialValue + actualIncrease);
        playerTeam.currentSpec.stability = newValue;
        actualIncrease = newValue - initialValue; // 実際に増えた分を再計算

        if (actualIncrease >= 3 && newValue === 100) alertMessage = "大成功！！\n安定感 が +" + actualIncrease + " され、上限(100)に達しました！";
        else if (actualIncrease >= 3) alertMessage = "大成功！！\n安定感 が +" + actualIncrease + " されました！ (現在値: " + newValue + ")"; // これは通常起こらないはずだが念のため
        else if (actualIncrease > 0 && newValue === 100) alertMessage = "成功！\n安定感 が +" + actualIncrease + " され、上限(100)に達しました！";
        else if (actualIncrease > 0) alertMessage = "成功！\n安定感 が +" + actualIncrease + " されました。 (現在値: " + newValue + ")";
        else alertMessage = "エラー？ 安定感の開発で値が増えませんでした。"; // 上限チェックは最初にしたはず

    } else { // straight, cornering, reliability
        let typeDisplay = type; // デフォルトは元の英語
        if (type === "straight") {
            typeDisplay = "ストレートスピード";
        } else if (type === "cornering") {
            typeDisplay = "コーナリングスピード";
        } else if (type === "reliability") {
            typeDisplay = "信頼性";
        }
        result = getRandomWeightedChoice(probabilities);
        if (result === "great") actualIncrease = 3;
        else if (result === "normal") actualIncrease = 1;
        else actualIncrease = 1; // トレードオフでもまず+1

        // ★加算後の値が100を超えないように Math.min を使う！
        const newValue = Math.min(100, initialValue + actualIncrease);
        playerTeam.currentSpec[type] = newValue;
        actualIncrease = newValue - initialValue; // 実際に増えた分を再計算

        if (result === "tradeoff") {
            const specsToReduce = ["straight", "cornering", "reliability"].filter(s => s !== type);
            let downSpecMessage = ""; // 低下メッセージ部分

            if (specsToReduce.length > 0) {
                const downSpec = specsToReduce[Math.floor(Math.random() * specsToReduce.length)];
                
                let downSpecDisplay = downSpec;
                if (downSpec === "straight") downSpecDisplay = "ストレートスピード";
                else if (downSpec === "cornering") downSpecDisplay = "コーナリング";
                else if (downSpec === "reliability") downSpecDisplay = "信頼性";

                if (playerTeam.currentSpec[downSpec] > 0) {
                    // ★低下する前の値(oldDownVal)と、低下した後の値(newDownVal)を取得します
                    const oldDownVal = playerTeam.currentSpec[downSpec];
                    playerTeam.currentSpec[downSpec]--;
                    const newDownVal = playerTeam.currentSpec[downSpec];
                    downSpecMessage = "\n" + downSpecDisplay + " が -1 されてしまいました(" + oldDownVal + " → " + newDownVal + ")";
                } else {
                    downSpecMessage = "\n(" + downSpecDisplay + " は0のため低下しませんでした)";
                }
            } else {
                downSpecMessage = "\n(低下対象なし)";
            }

            if (actualIncrease > 0) {
                const upperLimitText = (newValue === 100) ? " (上限)" : "";
                alertMessage = "トレードオフ発生！\n" + 
                               typeDisplay + " が +" + actualIncrease + " されたものの(" + initialValue + " → " + newValue + upperLimitText + ")、" + 
                               downSpecMessage; // (downSpecMessage の先頭に \n が入ってるので、くっつけるだけ)
            } else {
                // (上がる方がすでに上限だった場合)
                alertMessage = "トレードオフ発生！\n" + 
                               typeDisplay + " は既に上限(" + initialValue + ")です" + 
                               downSpecMessage;
            }
            // ★★★ 修正ここまで ★★★

        } else { // great or normal
             // (ここは「現在値」のまま、変更なしです)
             if (actualIncrease >= 3 && newValue === 100) alertMessage = "大成功！\n" + typeDisplay + " が +" + actualIncrease + " され、上限(100)に達しました！";
             else if (actualIncrease >= 3) alertMessage = "大成功！\n" + typeDisplay + " が +" + actualIncrease + " されました (現在値: " + newValue + ")";
             else if (actualIncrease > 0 && newValue === 100) alertMessage = "成功！\n" + typeDisplay + " が +" + actualIncrease + " され、上限(100)に達しました！";
             else if (actualIncrease > 0) alertMessage = "成功！\n" + typeDisplay + " が +" + actualIncrease + " されました (現在値: " + newValue + ")";
             else alertMessage = "エラー？ " + typeDisplay + "の開発で値が増えませんでした"; 
        }
    }

    alert(alertMessage);
    console.log(alertMessage);

    // ターン終了後の処理 (変更なし)
    if (playerTeam.developmentTurnsLeft > 0) {
        showDevelopmentScreen(isPreSeason, playerTeam.developmentTurnsLeft);
    } else {
        if (isPreSeason) {
            alert("残り開発ターンが 0 になりました！\nいよいよシーズン開幕です！");
            showSeasonScreen();
        } else {
            console.log("シーズン中開発終了。予選へ");
            runQualifyingSimulation();
        }
    }
}

/* =================================================================
   ロードマップ 5: シーズン中フェーズ (★全面改修！)
================================================================= */

/**
 * 5-1. シーズン中のメイン画面（次のレースへ）
 */
function showSeasonScreen() {
    if (currentRaceIndex >= RACE_CALENDAR.length) {
        showSeasonEndScreen(); return;
    }
    const race = RACE_CALENDAR[currentRaceIndex];
    if (!race) {
         console.error("エラー: 次のレース情報が見つかりません！"); showSeasonEndScreen(); return;
    }

    console.log("シーズン画面を表示します (次は R" + (currentRaceIndex + 1) + ")");
    titleElement.textContent = "シーズン中 (" + (currentRaceIndex + 1) + " / 16 戦)";
    contentElement.innerHTML = "";

    let html = "<p><b>" + (playerTeam.teamName || "あなたのチーム") + "</b>、次戦は「" + race.name + "」です</p>";

    // 開発ターン計算
    let turns = 0;
    if (currentRaceIndex > 0 && DEVELOPMENT_TURNS_PER_RACE && DEVELOPMENT_TURNS_PER_RACE.length > currentRaceIndex - 1) {
        turns = DEVELOPMENT_TURNS_PER_RACE[currentRaceIndex - 1];
    }

    // 次のアクションボタン
    if (turns > 0) {
         html += "<p>このレースの前に、" + turns + "ターンの開発期間があります</p>" +
                 "<button id='goto-dev-btn'>シーズン中開発へ進む</button>";
    } else {
        html += "<p>今週はレースウィークです！ 開発ターンはありません</p>" +
                "<button id='goto-race-btn'>予選へ進む</button>";
    }

    // ★★★ 現在のランキング表示 (シンプル版！) ★★★
    html += "<hr><h3>現在のランキング (" + currentRaceIndex + "戦 終了時点)</h3>";

    // --- コンストラクターズ ---
    html += "<h4>コンストラクターズ</h4>";
    let constructorRanking = [];
    aiTeams.forEach(team => { constructorRanking.push({ name: team.machine.name, points: team.points || 0 }); });
    constructorRanking.push({ name: playerTeam.teamName, points: playerTeam.totalPoints || 0 });
    constructorRanking.sort((a, b) => b.points - a.points);

    // ★<ol>タグから style 属性を削除！
    html += "<ol>";
    constructorRanking.forEach((team) => {
        if (team.name === playerTeam.teamName) {
            html += "<li><b>" + team.name + " - " + team.points + " pts</b></li>";
        } else {
            html += "<li>" + team.name + " - " + team.points + " pts</li>";
        }
    });
    html += "</ol>";

    // --- ドライバーズ ---
    html += "<h4>ドライバーズ</h4>";
    let driverRanking = [];
    EXISTING_DRIVERS.forEach(d => driverRanking.push({ name: d.name, points: d.points || 0, isPlayer: false }));
    if(playerTeam.driver1) driverRanking.push({ name: playerTeam.driver1.name, points: playerTeam.driver1.points || 0, isPlayer: true });
    if(playerTeam.driver2) driverRanking.push({ name: playerTeam.driver2.name, points: playerTeam.driver2.points || 0, isPlayer: true });
    driverRanking.sort((a, b) => b.points - a.points);

    // ★<ol>タグから style 属性を削除！
    html += "<ol>";
    driverRanking.forEach((driver) => {
        if (driver.isPlayer) {
            html += "<li><b>" + driver.name + " - " + driver.points + " pts</b></li>";
        } else {
            html += "<li>" + driver.name + " - " + driver.points + " pts</li>";
        }
    });
    html += "</ol>";
    // ★★★ ランキング表示ここまで ★★★

    contentElement.innerHTML = html;

    // ボタンに関数を割り当て
    if (turns > 0) {
        document.getElementById("goto-dev-btn").onclick = function() { showDevelopmentScreen(false, turns); };
    } else {
        document.getElementById("goto-race-btn").onclick = function() { runQualifyingSimulation(); };
    }
}

/**
 * 5-2. 予選シミュレーションを実行する (★NEW!)
 */
function runQualifyingSimulation() {
    const race = RACE_CALENDAR[currentRaceIndex];
    console.log(race.name + " の予選シミュレーションを開始します");
    
    const playerMachine1 = { ...playerTeam.currentSpec, tyre: playerTeam.tyre };
    const playerMachine2 = { ...playerTeam.currentSpec, tyre: playerTeam.tyre };
    
    const allTeams = [
        { name: playerTeam.teamName, machine: playerMachine1, driver: playerTeam.driver1 },
        { name: playerTeam.teamName, machine: playerMachine2, driver: playerTeam.driver2 },
    ];
    aiTeams.forEach(team => {
        allTeams.push({ name: team.machine.name, machine: team.machine, driver: team.driver1 });
        allTeams.push({ name: team.machine.name, machine: team.machine, driver: team.driver2 });
    });
    
    const isQualiWet = (Math.random() < 0.20);
    console.log("予選は雨？: " + isQualiWet);
    
    currentQualiResults = []; // ★グローバル変数をリセット
    
    allTeams.forEach(entry => {
        const performance = calculatePerformance(entry.driver, entry.machine, true, race.type, isQualiWet);
        currentQualiResults.push({
            name: entry.driver.name,
            teamName: entry.name,
            performance: performance
        });
    });
    
    currentQualiResults.sort((a, b) => b.performance - a.performance);
    
    // 予選結果画面を表示する
    showQualifyingResultScreen(race, isQualiWet);
}

/**
 * 5-3. 予選結果の表示画面 (★名前表示を再確認！)
 */
function showQualifyingResultScreen(race, isQualiWet) {
    titleElement.textContent = "第" + race.round + "戦 " + race.name + " 予選結果";
    contentElement.innerHTML = "";

    let html = "<h3>予選リザルト</h3>";
    if (isQualiWet) html += "<p><b>(ウェットコンディション)</b></p>";

    html += "<ol>";
    currentQualiResults.forEach((result, index) => {
        console.log("Quali Result " + (index+1) + ": ", result.name);
        const teamName = (result.teamName === playerTeam.teamName) ? "<b>" + playerTeam.teamName + "</b>" : result.teamName;
        const driverName = (result.teamName === playerTeam.teamName) ? "<b>" + result.name + "</b>" : result.name;

        html += "<li>" + driverName + " (" + teamName + ")</li>";
    });
    html += "</ol><hr>";

    html += "<button id='start-race-btn'>決勝レースへ進む</button>";
    contentElement.innerHTML = html;

    document.getElementById("start-race-btn").onclick = function() {
        runRaceSimulation();
    };
}


/**
 * 5-4. 決勝シミュレーションを実行する (★優勝カウント追加版!)
 */
function runRaceSimulation() {
    const race = RACE_CALENDAR[currentRaceIndex];
    console.log(race.name + " の決勝シミュレーションを開始します");
    
    // 予選順位のマップを作ります
    const qualiPositionMap = {};
    currentQualiResults.forEach((result, index) => {
        qualiPositionMap[result.name] = index + 1; // (1位～22位)
    });
    
    // 全チームのリストを、もう一回作ります
    const playerMachine1 = { ...playerTeam.currentSpec, tyre: playerTeam.tyre };
    const playerMachine2 = { ...playerTeam.currentSpec, tyre: playerTeam.tyre };
    const allTeams = [
        { name: playerTeam.teamName, machine: playerMachine1, driver: playerTeam.driver1 },
        { name: playerTeam.teamName, machine: playerMachine2, driver: playerTeam.driver2 },
    ];
    aiTeams.forEach(team => {
        allTeams.push({ name: team.machine.name, machine: team.machine, driver: team.driver1 });
        allTeams.push({ name: team.machine.name, machine: team.machine, driver: team.driver2 });
    });

    const isRaceWet = (Math.random() < 0.20);
    console.log("決勝は雨？: " + isRaceWet);
    
    let raceResults = [];
    let retiredDrivers = [];
    let playerRacePoints = 0;
    
    allTeams.forEach(entry => {
        let machineRel = entry.machine.reliability;
        let driverRel = entry.driver.reliability;
        
        if (isRaceWet) {
            machineRel -= 10;
            driverRel -= 10;
        }

        // リタイア判定
        if (Math.random() < (100 - machineRel) / 100.0) {
            retiredDrivers.push({ name: entry.driver.name, teamName: entry.name, reason: "メカニカルトラブル" });
            return;
        }
        if (Math.random() < (100 - driverRel) / 100.0) {
            retiredDrivers.push({ name: entry.driver.name, teamName: entry.name, reason: "ドライビングエラー" });
            return;
        }
        
        // 完走！
        const performance = calculatePerformance(entry.driver, entry.machine, false, race.type, isRaceWet);
        const qualiPos = qualiPositionMap[entry.driver.name];
        const penalty = 1 * (qualiPos - 1);
        
        raceResults.push({
            name: entry.driver.name,
            teamName: entry.name,
            driverRef: entry.driver, // ★ドライバーの参照をそのまま渡します
            performance: performance - penalty
        });
    });
    
    raceResults.sort((a, b) => b.performance - a.performance);
    
    // ポイント＆賞金 獲得 (★フィニッシュ順位の記録を追加！)
    raceResults.forEach((result, index) => {
        const position = index + 1; // 決勝順位 (1位, 2位...)

        // ★NEW!★ 優勝回数のカウント
        if (position === 1 && result.teamName === playerTeam.teamName) {
            playerTeam.careerWins = (playerTeam.careerWins || 0) + 1; // NaN対策
            console.log("プレイヤーチームが優勝！ 通算優勝回数を+1 (現在: " + playerTeam.careerWins + "回)");
        }

        // ★フィニッシュ順位を記録 (8位以内のみ)
        if (position <= 8) {
            // result.driverRef は Driver オブジェクトのはず
            if (result.driverRef && result.driverRef.finishes) {
                result.driverRef.finishes[position] = (result.driverRef.finishes[position] || 0) + 1;
            } else {
                 console.error("フィニッシュ記録エラー：driverRef または finishes が見つかりません", result);
            }
        }

        // ポイント加算
        if (POINTS_SYSTEM[position]) {
            const points = POINTS_SYSTEM[position];
            // ドライバーズポイント (NaN対策済み)
            result.driverRef.points = (result.driverRef.points || 0) + points;

            // コンストラクターズポイント (NaN対策済み)
            if (result.teamName === playerTeam.teamName) {
                playerTeam.totalPoints = (playerTeam.totalPoints || 0) + points;
                playerRacePoints += points; // 賞金計算用
            } else {
                const aiTeam = aiTeams.find(t => t.machine.name === result.teamName);
                if (aiTeam) {
                    aiTeam.points = (aiTeam.points || 0) + points;
                }
            }
        }
    });

    const prizeMoney = playerRacePoints * 100;
    playerTeam.money += prizeMoney;

    if (prizeMoney > 0) {
        console.log("レース賞金 " + prizeMoney + "万ドル 獲得！");
    }
    // (アラートは showRaceResultScreen の方で出します)

    // 決勝結果画面を表示
    showRaceResultScreen(race, isRaceWet, raceResults, retiredDrivers, prizeMoney);
}

/**
 * 5-5. 決勝レース結果の表示画面 (★名前表示を再確認！)
 */
function showRaceResultScreen(race, isRaceWet, raceResults, retiredDrivers, prizeMoney) {
    titleElement.textContent = "第" + race.round + "戦 " + race.name + " 決勝結果";
    contentElement.innerHTML = "";

    let resultHTML = "<h3>決勝リザルト</h3>";
    if (isRaceWet) resultHTML += "<p><b>(ウェットコンディション)</b></p>";

    resultHTML += "<ol>";
    raceResults.forEach((result, index) => {
        // ★result.name がフルネームのはず！ ログで確認
        console.log("Race Result " + (index+1) + ": ", result.name);
        const position = index + 1;
        let pointText = "";
        if (POINTS_SYSTEM[position]) {
            pointText = " (" + POINTS_SYSTEM[position] + " pts)";
        }
        const isPlayer = (result.teamName === playerTeam.teamName);
        const teamName = isPlayer ? "<b>" + playerTeam.teamName + "</b>" : result.teamName;
        const driverName = isPlayer ? "<b>" + result.name + "</b>" : result.name;

        resultHTML += "<li>" + driverName + " (" + teamName + ")" + pointText + "</li>";
    });
    resultHTML += "</ol>";

    if (retiredDrivers.length > 0) {
        resultHTML += "<h3>リタイア</h3><ul>";
        retiredDrivers.forEach(driver => {
             // ★driver.name がフルネームのはず！ ログで確認
            console.log("Retired Driver: ", driver.name);
            const isPlayer = (driver.teamName === playerTeam.teamName);
            const teamName = isPlayer ? "<b>" + playerTeam.teamName + "</b>" : driver.teamName;
            const driverName = isPlayer ? "<b>" + driver.name + "</b>" : driver.name;
            resultHTML += "<li>" + driverName + " (" + teamName + ") - " + driver.reason + "</li>";
        });
        resultHTML += "</ul>";
    }

    contentElement.innerHTML = resultHTML;

    if (prizeMoney > 0) {
        alert("入賞！ 🏆\n賞金" + prizeMoney + "万ドルを獲得しました！");
    }

    // 次のステップへ (変更なし)
    const nextBtn = document.createElement("button");
    if (currentRaceIndex >= (RACE_CALENDAR.length - 1)) { /* ... */
        nextBtn.innerHTML = "シーズン終了フェーズへ進む";
        nextBtn.onclick = function() {
            currentRaceIndex++;
            showSeasonScreen();
        };
    } else { /* ... */
        nextBtn.innerHTML = "次のレースへ進む";
        nextBtn.onclick = function() {
            currentRaceIndex++;
            showSeasonScreen();
        };
    }
    contentElement.appendChild(document.createElement("hr"));
    contentElement.appendChild(nextBtn);
}

/**
 * 5-7. 予選/決勝の速さを計算する「お助け関数」
 * (★アメリカGPボーナス追加 ＆ 日本GPボーナスを+5に修正！)
 */
function calculatePerformance(driver, machine, isQualifying, raceType, isWet) {
    
    let straight = machine.straight;
    let cornering = machine.cornering;
    let stability = machine.stability;
    let driverSpeed = isQualifying ? driver.qs : driver.rs;
    let driverStability = driver.stability;
    
    if (isWet) {
        stability -= 10;
        driverStability -= 10;
    }
    
    const race = RACE_CALENDAR[currentRaceIndex]; // ★先にレース情報を読み込みます

    if (isWet && machine.tyre === "Bridgestone") {
        cornering += 3;
    }
    if (!isWet && machine.tyre === "Michelin") {
        if (race.name === "マレーシアGP" || race.name === "ハンガリーGP") {
            cornering += 3;
        }
    }
    
    // ★★★ ここからが修正箇所です！ ★★★

    // ★佐藤琢磨選手のボーナス (★+3 を +5 に修正します！)
    if (driver.specialAbilityCode === 'RACE_BONUS_JP' && race.name === "日本GP") {
        console.log("佐藤琢磨ボーナス発動！");
        driverSpeed += 5; // (予選・決勝どっちも +5)
    }
    // ★NEW!★ アメリカGPボーナス
    else if (driver.specialAbilityCode === 'RACE_BONUS_US' && race.name === "アメリカGP") {
        console.log("アメリカGPボーナス発動！");
        driverSpeed += 10; // (予選・決勝どっちも +10)
    }
    // ★★★ 修正ここまで ★★★


    let machineSpeed;
    if (raceType === "Straight") {
        machineSpeed = (straight * 1.5) + (cornering * 0.5);
    } else if (raceType === "Cornering") {
        machineSpeed = (straight * 0.5) + (cornering * 1.5);
    } else {
        machineSpeed = straight + cornering;
    }

    const baseStrength = machineSpeed + driverSpeed;

    const maxVariance = (100 - stability) + (100 - driverStability);
    const variance = (Math.random() * maxVariance) - (Math.random() * maxVariance);

    return baseStrength + variance;
}

/**
 * 6-1. シーズン終了画面 (★通算成績の記録処理を追加！)
 */
function showSeasonEndScreen() {
    console.log("シーズン終了画面を表示します");
    titleElement.textContent = "シーズン終了 (" + playerTeam.year + "年目)";
    contentElement.innerHTML = "";

    // ★★★ シーズン終了時のスペックを保存！ (最重要) ★★★
    console.log("スペック保存前の currentSpec:", playerTeam.currentSpec);
    // currentSpec が存在し、各プロパティが数値であることを確認
    if (playerTeam.currentSpec &&
        typeof playerTeam.currentSpec.straight === 'number' &&
        typeof playerTeam.currentSpec.cornering === 'number' &&
        typeof playerTeam.currentSpec.reliability === 'number' &&
        typeof playerTeam.currentSpec.stability === 'number')
    {
        // プロパティを個別にコピー
        playerTeam.endOfSeasonSpec = {
            straight: playerTeam.currentSpec.straight,
            cornering: playerTeam.currentSpec.cornering,
            reliability: playerTeam.currentSpec.reliability,
            stability: playerTeam.currentSpec.stability
        };
        console.log("★シーズン終了時のスペックを endOfSeasonSpec に保存しました:", playerTeam.endOfSeasonSpec);
    } else {
        console.error("★★★ エラー：currentSpec が不正なため、endOfSeasonSpec を正しく保存できませんでした！ ★★★", playerTeam.currentSpec);
        // ★エラーでも、最低限の初期値を設定しておく (次の undefined エラーを防ぐため)
        playerTeam.endOfSeasonSpec = { straight: 0, cornering: 0, reliability: 0, stability: 0 };
    }
    // ★★★ 保存処理ここまで ★★★

    // --- ここからHTML生成 ---
    let resultHTML = "<h3>" + playerTeam.year + "年目シーズン、お疲れ様でした！</h3>";
    
    // コンストラクターズランキング (シンプル版)
    resultHTML += "<h4>コンストラクターズランキング</h4>";
    let constructorRanking = [];
    aiTeams.forEach(team => { constructorRanking.push({ name: team.machine.name, points: team.points || 0 }); });
    constructorRanking.push({ name: playerTeam.teamName, points: playerTeam.totalPoints || 0 });
    constructorRanking.sort((a, b) => b.points - a.points);
    resultHTML += "<ol>";
    let playerRank = -1; // プレイヤーの順位 (1位～11位)
    constructorRanking.forEach((team, index) => {
         if (team.name === playerTeam.teamName) playerRank = index + 1;
         if (team.name === playerTeam.teamName) {
             resultHTML += "<li><b>" + team.name + " - " + team.points + " pts</b></li>";
         } else {
             resultHTML += "<li>" + team.name + " - " + team.points + " pts</li>";
         }
     });
    resultHTML += "</ol>";
    // 賞金計算
    let prizeMoney = 0;
    if (playerRank > 0 && playerRank <= 10) {
         prizeMoney = (11 - playerRank) * 1000;
         resultHTML += "<p><b>コンストラクターズ " + playerRank + "位！</b><br>" +
                         "賞金 <b>" + prizeMoney + "万ドル</b> を獲得しました！</p>";
    } else {
         resultHTML += "<p><b>ランキング最下位のため賞金はありません</b></p>";
    }
    
    // ドライバーズランキング (シンプル版)
    resultHTML += "<hr><h4>ドライバーズランキング</h4>";
    let allDriversForRanking = []; // ★NEW!★ 通算成績記録のために、外で宣言
    EXISTING_DRIVERS.forEach(d => {
        let teamName = "フリー";
        const teamData = aiTeams.find(t=> (t.driver1 && t.driver1.id === d.id) || (t.driver2 && t.driver2.id === d.id));
        if(teamData) teamName = teamData.machine.name;
        allDriversForRanking.push({ name: d.name, teamName: teamName, points: d.points || 0, isPlayer: false });
    });
    [playerTeam.driver1, playerTeam.driver2].forEach(d => {
        if (d) {
             allDriversForRanking.push({ name: d.name, teamName: playerTeam.teamName, points: d.points || 0, isPlayer: true });
        }
    });
    allDriversForRanking.sort((a, b) => b.points - a.points);
    resultHTML += "<ol>";
    allDriversForRanking.forEach(driver => {
        const teamDisplay = driver.teamName ? "(" + driver.teamName + ")" : "";
        if (driver.isPlayer) {
            resultHTML += "<li><b>" + driver.name + " " + teamDisplay + " - " + driver.points + " pts</b></li>";
        } else {
            resultHTML += "<li>" + driver.name + " " + teamDisplay + " - " + driver.points + " pts</li>";
        }
    });
    resultHTML += "</ol>";

    // 最終表示
    playerTeam.money += prizeMoney;
    resultHTML += "<hr><p><b>最終資金: " + playerTeam.money + "万ドル</b></p>";
    resultHTML += "<hr><button id='next-season-btn'>オフシーズンへ進む</button>";
    contentElement.innerHTML = resultHTML;

    // ★★★ 通算成績の記録 (ポイントリセット前に行う！) ★★★
    console.log("通算成績を記録します...");

    // 1. 通算ポイントの加算 (NaN対策)
    playerTeam.totalCareerPoints = (playerTeam.totalCareerPoints || 0) + (playerTeam.totalPoints || 0);

    // 2. 年度別成績の記録
    playerTeam.annualResults.push({
        year: playerTeam.year,
        rank: playerRank > 0 ? playerRank : 11, // (ランク外は11位扱い)
        points: playerTeam.totalPoints || 0
    });

    // 3. コンストラクターズタイトル記録
    if (playerRank === 1) {
        playerTeam.careerConstructorTitles = (playerTeam.careerConstructorTitles || 0) + 1;
        console.log("コンストラクターズタイトル獲得！ 通算: " + playerTeam.careerConstructorTitles + "回");
    }

    // 4. ドライバーズタイトル記録
    if (allDriversForRanking.length > 0 && allDriversForRanking[0].isPlayer) {
        playerTeam.careerDriverTitles = (playerTeam.careerDriverTitles || 0) + 1;
        console.log("ドライバーズタイトル獲得！ (" + allDriversForRanking[0].name + ") 通算: " + playerTeam.careerDriverTitles + "回");
    }
    console.log("通算成績の記録 完了。");
    // ★★★ 記録ここまで ★★★


    // ★★★ ポイントリセット (ここは修正済み) ★★★
    console.log((playerTeam.year + 1) + "年目に向けてポイントとフィニッシュ回数をリセットします");
    playerTeam.totalPoints = 0; // プレイヤーチームのポイント
    aiTeams.forEach(team => team.points = 0); // AIチームのポイント

    // ▼▼▼ (省略) だった部分を、ちゃんと定義します！ ▼▼▼
    const resetDriverStats = (driver) => {
        // driver が null じゃないか、ちゃんとあるか確認します
        if (driver && typeof driver === 'object') {
            driver.points = 0; // ポイントを0に！
            // フィニッシュ回数もリセットします
            driver.finishes = [0, 0, 0, 0, 0, 0, 0, 0, 0]; 
        }
    };
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    // 全ドライバーのポイントとフィニッシュをリセットします
    EXISTING_DRIVERS.forEach(resetDriverStats); // AIドライバー(20人)
    resetDriverStats(playerTeam.driver1); // プレイヤードライバー1
    resetDriverStats(playerTeam.driver2); // プレイヤードライバー2
    AVAILABLE_DRIVERS.forEach(resetDriverStats); // 浪人ドライバー(45人)

    // ボタン割り当て
    document.getElementById("next-season-btn").onclick = function() {
        startOffSeason();
    };
}

// ----------------------------------------------------------------
// 3. 起動の合図
// ----------------------------------------------------------------

/* =================================================================
   ★NEW!★ オフシーズンフェーズ
================================================================= */

/**
 * オフシーズンを開始する関数
 * (★5年満了エンディングへの分岐を追加！)
 */
function startOffSeason() {
    playerTeam.year++; // まず年数を増やします
    console.log("オフシーズン開始！ (" + playerTeam.year + "年目)");

    // ★NEW!★ 5年満了チェック (5年目が終わって、6年目になるとき)
    if (playerTeam.year > 5) {
        console.log("5年間のプレイが終了しました。エンディング画面を表示します。");
        showGameEndingScreen(); // ★新しいエンディング関数を呼び出す
        return; // ★重要！いつものオフシーズン処理を中断します
    }
    // ★★★ チェックここまで ★★★

    currentRaceIndex = 0; // レースインデックスリセット

    // ★★★ AIドライバーの契約年数更新処理を削除 ★★★
    console.log("プレイヤーチームのドライバー契約状況を確認します...");
    // プレイヤーチームのドライバー (契約期間満了のログ表示)
    if (playerTeam.driver1) {
        playerTeam.driver1.contractYears = 0;
        console.log(" - " + playerTeam.driver1.name + " (Player) -> 契約期間満了");
    }
    if (playerTeam.driver2) {
        playerTeam.driver2.contractYears = 0;
        console.log(" - " + playerTeam.driver2.name + " (Player) -> 契約期間満了");
    }
    // ★★★ 更新処理ここまで ★★★

    showDriverRenewalScreen(1); // ドライバー1の契約更新へ
}

/**
 * ドライバー契約更新画面を表示する
 * @param {number} driverNumber 1か2
 */
function showDriverRenewalScreen(driverNumber) {
    const driver = (driverNumber === 1) ? playerTeam.driver1 : playerTeam.driver2;
    console.log("ドライバー契約更新画面を表示します (ドライバー" + driverNumber + ": " + driver.name + ")");

    titleElement.textContent = "オフシーズン (" + playerTeam.year + "年目) - ドライバー契約更新 (" + driverNumber + "/2)";
    contentElement.innerHTML = "";

    let html = "<h3>ドライバー " + driverNumber + ": " + driver.name + " との契約更新</h3>" +
               "<p><b>" + driver.name + "</b> (" + driver.nationality + ")</p>" +
               "<p>予選速さ:" + driver.qs +
               " / 決勝速さ:" + driver.rs +
               " / 信頼性:" + driver.reliability +
               " / 安定感:" + driver.stability + "</p>" +
               "<p><b>【年俸】: " + driver.salary + "万ドル</b></p>" +
               "<hr>";

    // お金が足りるかチェック
    const canAfford = (playerTeam.money >= driver.salary || driver.salary <= 0); // マイナス年俸はOK

    // 契約更新ボタン
    html += "<button id='renew-btn'>契約を更新する</button>";

    // 放出ボタン
    html += "<button id='release-btn' style='margin-left: 10px;'>放出する</button>";

    if (!canAfford) {
        html += "<p style='color: red; font-weight: bold;'>※資金不足のため、契約更新はできません！ 放出して他のドライバーを選択してください</p>";
    }

    contentElement.innerHTML = html;

    // ボタンに関数を割り当て
    const renewBtn = document.getElementById("renew-btn");
    if (canAfford) {
        renewBtn.onclick = function() {
            handleDriverRenewalDecision(driverNumber, true); // true = 更新する
        };
    } else {
        renewBtn.disabled = true; // 押せないようにする
    }

    document.getElementById("release-btn").onclick = function() {
        handleDriverRenewalDecision(driverNumber, false); // false = 放出する
    };

    // 現在の資金を表示
    const moneyDiv = document.createElement("p");
    moneyDiv.innerHTML = "<hr><b>現在の資金: " + playerTeam.money + "万ドル</b>";
    contentElement.appendChild(moneyDiv);
}

/**
 * ドライバー契約更新の決定を処理する関数
 * (★終了後の動きを修正！)
 * @param {number} driverNumber 1か2
 * @param {boolean} renew 更新するならtrue
 */
function handleDriverRenewalDecision(driverNumber, renew) {
    const driver = (driverNumber === 1) ? playerTeam.driver1 : playerTeam.driver2;

    if (renew) {
        playerTeam.money -= driver.salary;
        driver.team = playerTeam.teamName; // ★更新したので所属チームを記録
        console.log("ドライバー" + driverNumber + " (" + driver.name + ") と契約更新。残り資金: " + playerTeam.money);
    } else {
        console.log("ドライバー" + driverNumber + " (" + driver.name + ") を放出します。");
        driver.team = null; // ★放出したので所属チームを消す
        if (driverNumber === 1) {
            playerTeam.driver1 = null;
        } else {
            playerTeam.driver2 = null;
        }
    }

    // 次のステップへ
    if (driverNumber === 1) {
        showDriverRenewalScreen(2); // ドライバー2の更新へ
    } else {
        // ドライバー2人の更新/放出が終わった
        console.log("契約更新フェーズ終了。新規契約に進みます。");
        // ★アラートを消して、次の新規契約画面へ！
        showNewDriverContractScreen();
    }
}

/**
 * ドライバー新規契約画面を表示する
 * (★アメリカGPボーナスの注釈を追加！)
 */
function showNewDriverContractScreen() {
    // 空いている枠を確認します (nullなら空き)
    const needsDriver1 = (playerTeam.driver1 === null);
    const needsDriver2 = (playerTeam.driver2 === null);
    const slotsToFill = (needsDriver1 ? 1 : 0) + (needsDriver2 ? 1 : 0);

    // もし空きがなければ、次のタイヤ選択に進みます
    if (slotsToFill === 0) {
        console.log("ドライバー枠に空きがないため、タイヤ選択に進みます。");
        showOffSeasonTyreScreen(); 
        return;
    }

    const targetSlotText = needsDriver1 ? "ドライバー1" : "ドライバー2"; // どちらの枠を埋めるか

    console.log("ドライバー新規契約画面を表示します (" + targetSlotText + ")");
    titleElement.textContent = "オフシーズン (" + playerTeam.year + "年目) - 新規ドライバー契約 (" + targetSlotText + ")";
    contentElement.innerHTML = "";

    contentElement.innerHTML = "<p>空いているドライバー枠 (" + targetSlotText + ") に、新しいドライバーを契約します</p>" +
                                 "<p>獲得可能ドライバーリストから、契約するドライバーを選んでください（契約は1年単位です）</p>";

    const driverListContainer = document.createElement("div");
    driverListContainer.className = "driver-list-container"; // スクロールできるように

    // ★更新された「獲得可能ドライバー」リストを取得します
    const updatedAvailableDrivers = getUpdatedAvailableDrivers();

    updatedAvailableDrivers.forEach(driver => {
        const btn = document.createElement("button");
        btn.className = "driver-button";

        // ★★★ ここからが修正箇所です！ ★★★
        let abilityTexts = []; // 特殊能力のテキストを入れる箱

        // 1. 開発ボーナス
        if (driver.specialAbilityCode === 'DEV_UP') {
            abilityTexts.push("マシン開発効果アップ");
        }
        
        // 2. レースボーナス
        if (driver.specialAbilityCode === 'RACE_BONUS_JP') {
            abilityTexts.push("日本GPで速さ+5");
        } 
        // ★NEW!★ アメリカGPボーナス
        // ★修正点2: } の後の変な空白を削除し、else if をくっつけました
        else if (driver.specialAbilityCode === 'RACE_BONUS_US') {
            abilityTexts.push("アメリカGPで速さ+10");
        }
        // ★★★ 修正ここまで ★★★


        // 3. エンジン割引 (ドライバーIDで判定)
        const driverId = driver.id;
        if (driverId === "massa" || driverId === "badoer") {
            abilityTexts.push("起用するとフェラーリエンジン割引");
        } else if (driverId === "sato" || driverId === "fukuda" || driverId === "kaneishi") {
            abilityTexts.push("起用するとホンダエンジン割引");
        } else if (driverId === "takagi" || driverId === "briscoe" || driverId === "zonta") {
            abilityTexts.push("起用するとトヨタエンジン割引");
        }
        // ★修正点3: } の後の変な空白を削除しました
        
        // 4. エンジン割引 (国籍で判定)
        if (driver.nationality === "ドイツ") {
            abilityTexts.push("起用するとBMWエンジン割引");
        }

        // 5. ぜんぶ合体させて、表示用のテキストを作る
        let abilityDisplay = "";
        if (abilityTexts.length > 0) {
            abilityDisplay = " <small>[" + abilityTexts.join(", ") + "]</small>";
        }

        // ★修正点1: "<br>"G" + を "<br>" + に直しました！
        btn.innerHTML = "<b>" + driver.name + "</b> (" + driver.nationality + ")" + abilityDisplay + "<br>" + 
                        "予選速さ:" + driver.qs +
                        " / 決勝速さ:" + driver.rs +
                        " / 信頼性:" + driver.reliability +
                        " / 安定感:" + driver.stability + "<br>" + // ← ★ココ！★
                        "<b>【年俸】: " + driver.salary + "万ドル</b>";

        btn.onclick = function() {
            if (driver.salary > 0 && playerTeam.money < driver.salary) {
                alert("資金が足りません！\n" + driver.name + " とは契約できません");
            } else {
                selectNewDriver(driver, needsDriver1); // (どっちの枠か教えます)
            }
        };
        driverListContainer.appendChild(btn);
    });

    contentElement.appendChild(driverListContainer);

     // 現在の資金を表示
    const moneyDiv = document.createElement("p");
    moneyDiv.innerHTML = "<hr><b>現在の資金: " + playerTeam.money + "万ドル</b>";
    contentElement.appendChild(moneyDiv);
}

/**
 * オフシーズン用の「獲得可能ドライバー」リストを作成する関数
 * (★引き抜き廃止により、AVAILABLE_DRIVERS のみ対象に修正！)
 */
function getUpdatedAvailableDrivers() {
    let available = [];

    // 1. AVAILABLE_DRIVERS リストから、プレイヤーが現在雇っていない選手を追加
    available = AVAILABLE_DRIVERS.filter(d => {
        // プレイヤーのドライバー1でもなく、ドライバー2でもない選手
        const isPlayerDriver1 = playerTeam.driver1 && playerTeam.driver1.id === d.id;
        const isPlayerDriver2 = playerTeam.driver2 && playerTeam.driver2.id === d.id;
        return !isPlayerDriver1 && !isPlayerDriver2;
    });

    // (AI契約切れ選手の追加処理は削除)
    // (プレイヤー放出選手の追加処理も不要)

    // リストを名前順にソート
    available.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
    console.log("現在の獲得可能ドライバーリスト（" + available.length + "名）を作成しました。");
    return available;
}

/**
 * 新規ドライバー選択ボタンが押された時に実行される関数
 * (★引き抜き関連処理を削除！)
 * @param {Driver} selectedDriver 選ばれたドライバー
 * @param {boolean} isForSlot1 ドライバー1の枠ならtrue
 */
function selectNewDriver(selectedDriver, isForSlot1) {
    playerTeam.money -= selectedDriver.salary;

    if (isForSlot1) {
        playerTeam.driver1 = selectedDriver;
        playerTeam.driver1.team = playerTeam.teamName; // 所属チームを記録
        console.log("ドライバー1として " + selectedDriver.name + " と新規契約。");
    } else {
        playerTeam.driver2 = selectedDriver;
        playerTeam.driver2.team = playerTeam.teamName; // 所属チームを記録
        console.log("ドライバー2として " + selectedDriver.name + " と新規契約。");
    }

    console.log("残り資金: " + playerTeam.money + "万ドル");

    // ★★★ AIチームからの引き抜き処理を削除 ★★★

    // まだ埋める枠が残ってるか？
    const stillNeedsDriver1 = (playerTeam.driver1 === null);
    const stillNeedsDriver2 = (playerTeam.driver2 === null);
    if (stillNeedsDriver1 || stillNeedsDriver2) {
        showNewDriverContractScreen(); // もう一回新規契約へ
    } else {
        // 2人とも決まった！
        console.log("新規ドライバー契約フェーズ終了。次はタイヤ選択へ。");
        showOffSeasonTyreScreen(); // タイヤ選択へ
    }
}

/**
 * オフシーズン：タイヤ選択画面を表示する
 */
function showOffSeasonTyreScreen() {
    console.log("オフシーズン：タイヤ選択画面を表示します");
    titleElement.textContent = "オフシーズン (" + playerTeam.year + "年目) - タイヤ選択";
    contentElement.innerHTML = "";

    contentElement.innerHTML =
        "<p>来シーズン使用するタイヤサプライヤーを選んでください（無料です）</p>" +
        "<button id='tyre-bs-off' class='choice-button'>ブリヂストン (Bridgestone)<br>" +
        "※雨(20%の確率で発生)ではコーナリングスピード +3" +
        "<button id='tyre-mi-off' class='choice-button'>ミシュラン (Michelin)<br>" +
        "※第2戦マレーシアGP / 第13戦ハンガリーGP ではコーナリングスピード +3</button>" +
        "<hr><p><b>現在の資金: " + playerTeam.money + "万ドル</b></p>"; // 資金表示

    document.getElementById("tyre-bs-off").onclick = function() { selectOffSeasonTyre("Bridgestone"); };
    document.getElementById("tyre-mi-off").onclick = function() { selectOffSeasonTyre("Michelin"); };
}

/**
 * オフシーズン：タイヤ選択ボタンが押された時に実行される関数
 * (★終了後にエンジン選択へ進むように修正！)
 * @param {string} selectedTyre 選ばれたタイヤ名
 */
function selectOffSeasonTyre(selectedTyre) {
    playerTeam.tyre = selectedTyre;
    if (playerTeam.chassis) {
        playerTeam.chassis.tyre = selectedTyre;
    }
    console.log("来シーズンのタイヤとして " + selectedTyre + " を選択しました。");

    // ★アラートを消して、次のエンジン選択画面へ！
    showOffSeasonEngineScreen();
}

/**
 * オフシーズン：エンジン選択画面を表示する
 * (★割引紹介文を discountText から表示するように修正！)
 */
function showOffSeasonEngineScreen() {
    console.log("オフシーズン：エンジン選択画面を表示します");
    titleElement.textContent = "オフシーズン (" + playerTeam.year + "年目) - エンジン選択";
    contentElement.innerHTML = "";

    contentElement.innerHTML =
        "<p>来シーズン使用するエンジンを選んでください</p>" +
        "<p>（" + playerTeam.year + "年目に契約可能なエンジンのみ表示されます）</p>";

    // 契約可能なエンジンをフィルタリング
    const availableEngines = ENGINE_OPTIONS.filter(engine => engine.availabilityYear <= playerTeam.year);

    availableEngines.forEach(engine => {
        const btn = document.createElement("button");
        btn.className = "choice-button";

        // ★価格チェック：割引の可能性も考慮します
        let actualPrice = engine.price;
        let discountInfo = ""; // 「(割引適用！)」の緑色の文字用
        let canAfford = false; // デフォルトは買えない

        if (engine.restriction) {
            let isDiscountApplicable = false;
            if (engine.restriction.drivers && playerTeam.driver1 && playerTeam.driver2) {
                const targetDriverIDs = engine.restriction.drivers;
                if (targetDriverIDs.includes(playerTeam.driver1.id) || targetDriverIDs.includes(playerTeam.driver2.id)) {
                    isDiscountApplicable = true;
                }
            } else if (engine.restriction.nationality && playerTeam.driver1 && playerTeam.driver2) {
                const targetNationality = engine.restriction.nationality;
                if (playerTeam.driver1.nationality === targetNationality || playerTeam.driver2.nationality === targetNationality) {
                    isDiscountApplicable = true;
                }
            }

            if (isDiscountApplicable) {
                actualPrice = engine.restriction.discountPrice;
                // ★「(割引適用！)」の緑色の文字を生成
                discountInfo = " <span style='color: green; font-weight: bold;'>(割引適用: " + actualPrice + "万ドル！)</span>";
            }
        }

        // 最終的な価格で買えるかチェック
        canAfford = (playerTeam.money >= actualPrice);

        // ★ここから表示の組み立て★
        let engineInfo = engine.name + "<br>" +
            "(ストレートへの影響:" + engine.straightBonus +
            ", コーナリングへの影響:" + engine.corneringBonus +
            ", 信頼性への影響:" + engine.reliabilityBonus + ")<br>" +
            "【価格】: " + engine.price + "万ドル"; // まず定価を表示
        
        // ★NEW!★ 割引紹介文 (discountText) があれば、それをそのまま表示
        if (engine.restriction && engine.restriction.discountText) {
            engineInfo += "<br><small>" + engine.restriction.discountText + "</small>";
        }

        // ★「(割引適用！)」の緑色の文字も、条件を満たせば追加
        if (discountInfo) {
            engineInfo += discountInfo;
        }
        // ★表示の組み立てここまで★

        btn.innerHTML = engineInfo;

        if (!canAfford) {
            btn.disabled = true; // お金が足りなければ押せない
            btn.innerHTML += "<br><small style='color: red;'>※資金不足 (割引適用後 " + actualPrice + "万ドル)</small>";
        }

        btn.onclick = function() {
            selectOffSeasonEngine(engine, actualPrice); // 支払う価格も渡す
        };
        contentElement.appendChild(btn);
    });

    // 現在の資金を表示
    const moneyDiv = document.createElement("p");
    moneyDiv.innerHTML = "<hr><b>現在の資金: " + playerTeam.money + "万ドル</b>";
    contentElement.appendChild(moneyDiv);
}

/**
 * オフシーズン：エンジン選択ボタンが押された時に実行される関数
 * (★「引継ぎ → 5低下 → 新エンジンボーナス」の順で計算！)
 * @param {Engine} selectedEngine 選ばれたエンジン
 * @param {number} finalPrice 実際に支払う価格（割引考慮済み）
 */
function selectOffSeasonEngine(selectedEngine, finalPrice) {
    if (playerTeam.money < finalPrice) {
        alert("エラー：資金が足りません！");
        return;
    }
    playerTeam.money -= finalPrice;
    playerTeam.engine = selectedEngine; // 来季のエンジンを決定
    console.log("来シーズンのエンジンとして " + selectedEngine.name + " と契約。支払い: " + finalPrice + "万ドル。残り資金: " + playerTeam.money);

    // ★★★ スペック計算 (引継ぎ → 低下 → ボーナス) ★★★
    // 1. 前シーズン終了時のスペックを安全に読み込む
    const baseSpecSource = playerTeam.endOfSeasonSpec;
    console.log("引継ぎ元の endOfSeasonSpec:", baseSpecSource);

    // 2. もし baseSpecSource が不正なら、警告を出して初期値(0)を使う
    let nextSeasonSpec;
    if (!baseSpecSource || typeof baseSpecSource.straight !== 'number') {
         console.error("★★★ エラー：引き継ぐべき endOfSeasonSpec が不正です！ 初期値(0)で続行します。 ★★★");
         nextSeasonSpec = { straight: 0, cornering: 0, reliability: 0, stability: 0 };
    } else {
         // 正しい値ならコピーして使う
         nextSeasonSpec = {
             straight: baseSpecSource.straight,
             cornering: baseSpecSource.cornering,
             reliability: baseSpecSource.reliability,
             stability: baseSpecSource.stability
         };
         console.log("スペックを前シーズン終了時の値に設定しました:", nextSeasonSpec);
    }

    // 3. ★新ルール★ 全てのスペックを一律で 5 下げる (下限は0)
    nextSeasonSpec.straight = Math.max(0, nextSeasonSpec.straight - 5);
    nextSeasonSpec.cornering = Math.max(0, nextSeasonSpec.cornering - 5);
    nextSeasonSpec.reliability = Math.max(0, nextSeasonSpec.reliability - 5);
    nextSeasonSpec.stability = Math.max(0, nextSeasonSpec.stability - 5);
    console.log("一律5低下処理後のスペック:", nextSeasonSpec);

    // 4. ★新エンジン★ のボーナスを取得 (数値保証)
    const engineBonus = {
         straight: (selectedEngine && typeof selectedEngine.straightBonus === 'number') ? selectedEngine.straightBonus : 0,
         cornering: (selectedEngine && typeof selectedEngine.corneringBonus === 'number') ? selectedEngine.corneringBonus : 0,
         reliability: (selectedEngine && typeof selectedEngine.reliabilityBonus === 'number') ? selectedEngine.reliabilityBonus : 0
    };
    console.log("新エンジンのボーナス:", engineBonus);

    // 5. 低下したスペックに、新エンジンのボーナスを加算する (上限100)
    playerTeam.currentSpec.straight = Math.min(100, nextSeasonSpec.straight + engineBonus.straight);
    playerTeam.currentSpec.cornering = Math.min(100, nextSeasonSpec.cornering + engineBonus.cornering);
    playerTeam.currentSpec.reliability = Math.min(100, nextSeasonSpec.reliability + engineBonus.reliability);
    playerTeam.currentSpec.stability = Math.min(100, nextSeasonSpec.stability); // 安定感も上限チェック
    // (もしエンジンボーナスで 0 を下回っても、0 になるように)
    playerTeam.currentSpec.straight = Math.max(0, playerTeam.currentSpec.straight);
    playerTeam.currentSpec.cornering = Math.max(0, playerTeam.currentSpec.cornering);
    playerTeam.currentSpec.reliability = Math.max(0, playerTeam.currentSpec.reliability);
    playerTeam.currentSpec.stability = Math.max(0, playerTeam.currentSpec.stability);

    console.log("来季の初期スペック（低下処理＋ボーナス加算後）が確定しました:", playerTeam.currentSpec);
    // ★★★★★ 修正ここまで ★★★★★


    alert("来シーズンのエンジンとして「" + selectedEngine.name + "」と契約しました！ (" + finalPrice + "万ドル)\n\n" +
          "【新車開発】\n" +
          "①現在のスペックから、ストレート/コーナリング/信頼性/安定感が一律で 5 低下します\n" +
          "②新たに選択したエンジンによるストレート/コーナリング/信頼性への影響が加算されます\n" +
          "③そのスペックを起点に、新シーズン用のマシン開発を行ってください");

    // 次の年の開幕前フェーズへ！
    console.log("オフシーズン終了。次の年の開幕前フェーズへ進みます。");
    showPreSeasonScreen();
}

/* =================================================================
 7. ★NEW!★ ゲームエンディング＆ハイスコア
================================================================= */

/**
 * 5年満了時のエンディング画面を表示する
 * (リザルト表示、ハイスコア保存＆表示)
 */
function showGameEndingScreen() {
    console.log("エンディング画面の処理を開始します。");
    titleElement.textContent = "ゲームクリア！ 5年間お疲れ様でした！";
    contentElement.innerHTML = ""; // 画面をリセット

    // 1. 今回の成績（ポイントと資金）をローカルストレージに保存
    const finalPoints = playerTeam.totalCareerPoints || 0;
    const finalMoney = playerTeam.money || 0;
    const teamName = playerTeam.teamName || "名無しのチーム";

    // (ローカルストレージへの保存処理は、お助け関数に任せます)
    const pointHighScores = saveAndGetHighScores("f1GameHighScores_Points", finalPoints, teamName);
    const moneyHighScores = saveAndGetHighScores("f1GameHighScores_Money", finalMoney, teamName);

    // 2. 通算成績（リザルト）のHTMLを作成
    let html = "<h2>" + teamName + " の5年間の軌跡</h2>";
    html += "<hr>";
    html += "<h3>通算成績</h3>";
    html += "<ul>";
    html += "<li><b>通算優勝回数:</b> " + (playerTeam.careerWins || 0) + " 回</li>";
    html += "<li><b>通算コンストラクターズタイトル獲得回数:</b> " + (playerTeam.careerConstructorTitles || 0) + " 回</li>";
    html += "<li><b>通算ドライバーズタイトル獲得回数:</b> " + (playerTeam.careerDriverTitles || 0) + " 回</li>";
    html += "<li><b>通算獲得ポイント:</b> " + finalPoints + " Pts.</li>";
    html += "<li><b>最終保有資金:</b> " + finalMoney + " 万ドル</li>";
    html += "</ul>";

    // 3. 年度別成績のHTMLを作成
    html += "<h3>年度別成績</h3>";
    html += "<ul>";
    if (playerTeam.annualResults && playerTeam.annualResults.length > 0) {
        playerTeam.annualResults.forEach(result => {
            html += "<li><b>" + result.year + "年目:</b> コンストラクターズ " + result.rank + "位 (" + result.points + " Pts.)</li>";
        });
    } else {
        html += "<li>記録がありません</li>";
    }
    html += "</ul><hr>";

    // 4. ハイスコアランキング（ポイント部門）のHTMLを作成
    html += formatHighScoresHTML("ハイスコア (獲得ポイント部門)", pointHighScores, "Pts.");
    
    // 5. ハイスコアランキング（資金部門）のHTMLを作成
    html += formatHighScoresHTML("ハイスコア (資金部門)", moneyHighScores, "万ドル");

    // 6. もう一度遊ぶボタン
    html += "<hr>";
    html += "<button id='play-again-btn'>もう一度最初から遊ぶ</button>";

    contentElement.innerHTML = html;

    // 7. ボタンに関数を割り当て
    document.getElementById("play-again-btn").onclick = function() {
        if (confirm("この画面を離れて、もう一度最初からプレイしますか？ (リザルトは保存されます)")) {
            // initializeGame(); だと古いデータが残る可能性があるので、リロードが一番安全です！
            location.reload();
        }
    };
}

/**
 * ハイスコアを読み書きするためのお助け関数
 * (ローカルストレージを操作します)
 * @param {string} storageKey - ローカルストレージのキー (部門ごと)
 * @param {number} newScore - 今回のスコア
 * @param {string} teamName - チーム名
 * @returns {Array} - 更新後のハイスコアリスト (Top 10)
 */
function saveAndGetHighScores(storageKey, newScore, teamName) {
    let highScores = [];
    try {
        // 1. 既存のスコアを読み込む
        const storedScores = localStorage.getItem(storageKey);
        if (storedScores) {
            highScores = JSON.parse(storedScores);
            // (もし配列じゃなかったら、空に戻します)
            if (!Array.isArray(highScores)) {
                highScores = [];
            }
        }
    } catch (e) {
        console.error("ハイスコアの読み込みに失敗しました:", e);
        highScores = [];
    }

    // 2. 今回のスコアを追加
    highScores.push({ team: teamName, score: newScore });

    // 3. スコア順 (降順) に並べ替え
    highScores.sort((a, b) => b.score - a.score);

    // 4. ベスト10だけを残す
    const top10Scores = highScores.slice(0, 10);

    // 5. ローカルストレージに保存
    try {
        localStorage.setItem(storageKey, JSON.stringify(top10Scores));
        console.log(storageKey + " のハイスコアを保存しました。");
    } catch (e) {
        console.error("ハイスコアの保存に失敗しました:", e);
    }

    // 6. 更新後のリストを返す
    return top10Scores;
}

/**
 * ハイスコアリストをHTML (ol) 形式に整形するお助け関数
 * @param {string} title - ランキングのタイトル
 * @param {Array} scores - スコアの配列
 * @param {string} unit - 単位 (例: "Pts.")
 * @returns {string} - HTML文字列
 */
function formatHighScoresHTML(title, scores, unit) {
    let html = "<h3>" + title + "</h3>";
    if (!scores || scores.length === 0) {
        html += "<p>まだ記録がありません。</p>";
        return html;
    }

    html += "<ol>"; // HTMLの自動番号を使います！
    scores.forEach(entry => {
        // entry.team や entry.score が null や undefined の場合に備えます
        const teamDisplay = entry.team || "名無し";
        const scoreDisplay = entry.score || 0;
        html += "<li><b>" + teamDisplay + "</b> - " + scoreDisplay + " " + unit + "</li>";
    });
    html += "</ol>";
    return html;
}

document.addEventListener("DOMContentLoaded", initializeGame);