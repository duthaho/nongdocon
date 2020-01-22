var STANDARD_DRINK_G = 10;
var METABOLIC_REMOVAL_RATE_GPH = 7.9;		// in g/hr
var WATER_CONTENT_OF_BLOOD = 0.8157;
var ALCOHOL_SPECIFIC_GRAVITY = 0.79;

var STANDARD_DRINK_ML = STANDARD_DRINK_G / ALCOHOL_SPECIFIC_GRAVITY;
var METABOLIC_REMOVAL_RATE_MLPH = METABOLIC_REMOVAL_RATE_GPH / ALCOHOL_SPECIFIC_GRAVITY;

if (Number.EPSILON === undefined) {
  Number.EPSILON = Math.pow(2, -52);
}

var $gender = $('#gender');
var $age = $('#age');
var $weight = $('#weight');
var $height = $('#height');
var $brand = $('#brand');
var $beer = $('#beer');
var $beerCup = $('#beer-cup');
var $beerCupNumber = $('#beer-cup-number');
var $wine = $('#wine');
var $wineCup = $('#wine-cup');
var $wineCupNumber = $('#wine-cup-number');
var $cup = $('#cup');
var $cupNumber = $('#cup-number');
var $categoryBeer = $('#category-beer');
var $categoryWine = $('#category-wine');
var $time = $('#time');

$wine.hide();
$wineCup.hide();
$wineCupNumber.hide();

$('#brand').on('change', function () {
  if (this.value === 'beer') {
    $beer.show();
    $beerCup.show();
    $wine.hide();
    $wineCup.hide();
    $wineCupNumber.hide();
  } else {
    $beer.hide();
    $beerCup.hide();
    $wine.show();
    $wineCup.show();
    $wineCupNumber.show();
  }
});

$('#add').on('click', function () {
  var incompleteBio = false;

  var age = +$age.val();
  if (age <= 0) { incompleteBio = true; }

  var height = +$height.val();
  if (height <= 0) { incompleteBio = true; }

  var weight = +$weight.val();
  if (weight <= 0) { incompleteBio = true; }

  var time = +$time.val();
  if (time < 0) { incompleteBio = true; }

  if (incompleteBio) {
    return alert('Vui lòng nhập đầy đủ thông tin...');
  }

  var sex = $gender.val() === 'male' ? 'm' : 'f';

  var ingestedMl = rupAlcoholMlInDrinks();
  var outputIngestedMl = Math.round(ingestedMl * 100) / 100;
  var outputStandardDrinks = Math.round(ingestedMl / STANDARD_DRINK_ML * 100 + Number.EPSILON) / 100;

  if (ingestedMl === 0.00) {
    var outputRemainingMl = 0.00;
    var outputBAC = 0.000;
    var minutesToOhFive = 0;
  } else {
    var elapsedTime = +$time.val() / 60;
    var outputRemainingMl = rupCalcRemaining(ingestedMl, elapsedTime);
    if (outputRemainingMl < 0) {
      outputRemainingMl = 0;
    }
    var bac = rupCalcBac(outputRemainingMl, rupCalcBodyWater(height, weight, age, sex));

    var bodyWaterMl = rupCalcBodyWater(height, weight, age, sex);

    outputRemainingMl = Math.round(outputRemainingMl * 100) / 100;
    outputBAC = Math.round(bac * 1000) / 1000;

    minutesToOhFive = rupCalcMinutesFromBac(outputBAC, bodyWaterMl);
  }

  // Display output
  var status = 'Thanh xuân như một chén trà, Tết mà không rượu hết bà thanh xuân.';
  var icon = 'hairy';
  if (outputBAC > 0.35) {
    status = 'Thành thật xin lỗi, bác sĩ chúng tôi đã cố gắng hết sức.';
    icon = 'cuddly';
  } else if (outputBAC > 0.26) {
    status = 'Đảm bảo ngày mai là bạn đếu còn nhớ gì cả.';
    icon = 'cuddly';
  } else if (outputBAC > 0.19) {
    status = 'Đường lên tiên cảnh là đây, đường này là đường của bố.';
    icon = 'devil';
  } else if (outputBAC > 0.12) {
    status = 'Alo Huệ ơi, Huệ ơi Huệ...';
    icon = 'devil';
  } else if (outputBAC > 0.07) {
    status = 'Các hãng xe công nghệ đang chờ bạn.';
    icon = 'gummy';
  } else if (outputBAC > 0.05) {
    status = 'Bắt đầu thông chốt được rồi đấy.';
    icon = 'gummy';
  } else if (outputBAC > 0.035) {
    status = 'Chén chú chén anh, rượu vơi lại đầy, vô tư đê.';
    icon = 'hairy';
  } else if (outputBAC > 0.005) {
    status = 'Anh CSGT ơi, đố anh bắt được em đó, hí hí.';
    icon = 'hairy';
  }

  var $info = $('<div class="post"><img src="http://www.sarabianchi.it/code-images/monsters/' + icon +
    '-monster.svg"><p>Đã nốc vào: <strong>' + outputIngestedMl +
    ' ml</strong><br>Còn lại trong cơ thể: <strong>' + outputRemainingMl +
    ' ml</strong><br>Nồng độ cồn trong máu: <strong>' + outputBAC +
    ' %</strong><br>Thời gian vận công để hết men: <strong>' + minutesToOhFive +
    ' phút</strong><br>Chỉ định: <strong>' + status +
    ' </strong></p></div>');
  $('.info').empty();
  $info.hide().prependTo('.info').fadeIn(300);
});

$('#reset').on('click', function () {
  $gender.val('male');
  $brand.val('beer');
  $beer.show();
  $beerCup.show();
  $wine.hide();
  $wineCup.hide();
  $wineCupNumber.hide();
  $weight.val('');
  $time.val('');
  $age.val('');
  $height.val('');
});

function rupCalcRemaining(ingested, elapsedTimeHours) {
  return (ingested - (METABOLIC_REMOVAL_RATE_MLPH * elapsedTimeHours));
}

function rupCalcBodyWater(height, weight, age, sex) {
  var HEIGHT_FACTOR = (sex == "m") ? 0.1074 : 0.1069;
  var WEIGHT_FACTOR = (sex == "m") ? 0.3362 : 0.2466;
  var AGE_FACTOR = (sex == "m") ? 0.09516 : 0;
  var BODY_WATER_CONST = (sex == "m") ? 2.447 : 2.097;
  var h = HEIGHT_FACTOR * height;
  var w = WEIGHT_FACTOR * weight;
  var a = AGE_FACTOR * age;
  var ml = (h - a + w + BODY_WATER_CONST) * 1000;
  return (ml);
}

// Result in % g/ml
function rupCalcBac(alcoholMl, bodyWaterMl) {
  bloodMl = bodyWaterMl / WATER_CONTENT_OF_BLOOD;
  alcoholGrams = alcoholMl * ALCOHOL_SPECIFIC_GRAVITY;
  bac = 100 * (alcoholGrams / bloodMl);
  return bac;
}

// // BAC in % g/ml
function rupCalcAlcoholRemainingFromBAC(bac, bodyWaterMl) {
  bloodMl = bodyWaterMl / WATER_CONTENT_OF_BLOOD;
  alcoholGrams = bloodMl * bac / 100
  alcoholMl = alcoholGrams / ALCOHOL_SPECIFIC_GRAVITY;
  return alcoholMl;
}

// BAC in % g/ml
function rupCalcMinutesFromBac(bac, bodyWaterMl) {
  if (bac <= 0) return 0;
  alcoholMl = rupCalcAlcoholRemainingFromBAC(bac, bodyWaterMl);
  return Math.ceil(alcoholMl * 60 / METABOLIC_REMOVAL_RATE_MLPH);
}

function rupAlcoholMlInDrinks() {
  var qty = 0, volume = 0, level = 0;
  if ($brand.val() === 'beer') {
    var beer = $categoryBeer.val().split('-');
    qty = $beerCupNumber.val();
    volume = beer[0];
    level = beer[1];
  } else {
    qty = $cupNumber.val();
    volume = $cup.val();
    level = $categoryWine.val();
  }
  return (qty * volume * level * 0.01);
}