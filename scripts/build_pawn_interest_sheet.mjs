import fs from "node:fs/promises"
import path from "node:path"
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool"

const outputDir = path.resolve("output/pawn-interest-calculator")
const outputPath = path.join(outputDir, "pawn-interest-calculation-review.xlsx")

const workbook = Workbook.create()
const calculator = workbook.worksheets.add("Calculator")

calculator.showGridLines = false

function setFill(range, color) {
    range.format.fill.color = color
}

function setFont(range, options) {
    Object.assign(range.format.font, options)
}

function setBorder(range, color = "#E5C16A") {
    range.format.borders.getItem("EdgeTop").style = "Continuous"
    range.format.borders.getItem("EdgeTop").color = color
    range.format.borders.getItem("EdgeBottom").style = "Continuous"
    range.format.borders.getItem("EdgeBottom").color = color
    range.format.borders.getItem("EdgeLeft").style = "Continuous"
    range.format.borders.getItem("EdgeLeft").color = color
    range.format.borders.getItem("EdgeRight").style = "Continuous"
    range.format.borders.getItem("EdgeRight").color = color
}

function anniversaryFormula(startRef, monthRef) {
    return `=IF(${startRef}="","",DATE(YEAR(${startRef}),MONTH(${startRef})+${monthRef},MIN(DAY(${startRef}),DAY(EOMONTH(DATE(YEAR(${startRef}),MONTH(${startRef})+${monthRef},1),0)))))`
}

calculator.getRange("A1:L1").merge()
calculator.getRange("A1").values = [["ตรวจสูตรคำนวณดอกเบี้ยจำนำ"]]
calculator.getRange("A2:L2").merge()
calculator.getRange("A2").values = [
    [
        "ใช้ชีตนี้เพื่อตรวจสูตรดอกเบี้ยจำนำ ปรับช่องสีอ่อนด้านซ้ายเพื่อทดสอบผลลัพธ์",
    ],
]

calculator.getRange("A3:B3").merge()
calculator.getRange("A3").values = [["ข้อมูลที่กรอก"]]
calculator.getRange("D3:F3").merge()
calculator.getRange("D3").values = [["ผลลัพธ์"]]
calculator.getRange("A13:C13").values = [["ขั้นตอน", "ค่า", "หมายเหตุ"]]
calculator.getRange("J3:L3").values = [["เดือนที่", "วันครบรอบ", "วันเกินจากรอบ"]]

calculator.getRange("A4:A9").values = [
    ["วันเริ่ม / ต่อดอกล่าสุด"],
    ["ยอดจำนำ"],
    ["โปรโมชัน"],
    ["รายการ"],
    ["วันที่ทำรายการ"],
    ["หมายเหตุ"],
]
calculator.getRange("B4:B9").values = [
    [new Date(2026, 3, 27)],
    [10000],
    ["โปรแสน (1.5%)"],
    ["ไถ่ของ"],
    [null],
    ["วันที่ทำรายการใช้ TODAY() เหมือนในเว็บ"],
]
calculator.getRange("B8").formulas = [["=TODAY()"]]

calculator.getRange("D4:D14").values = [
    ["ดอกเบี้ยที่ต้องชำระ"],
    ["ระยะเวลาทั้งสิ้น"],
    ["วิธีคิด"],
    ["การคำนวน"],
    ["สถานะสัญญา"],
    ["สถานะไถ่ของ"],
    [null],
    [null],
    [null],
    [null],
    [null],
]
calculator.getRange("E4:E9").formulas = [
    ['=IF($B$29="blocked","ไม่สามารถไถ่ได้",$B$32)'],
    ['=IF($B$4="","",$B$20&" เดือน "&$B$25&" วัน")'],
    ["=$B$33"],
    ["=$B$34"],
    ["=$B$28"],
    ['=IF($B$29="blocked","ไม่สามารถไถ่ได้","สามารถไถ่ได้")'],
]

calculator.getRange("A14:A36").values = [
    ["อัตราโปรโมชัน"],
    ["อัตราปรับ"],
    ["อัตรารายสัปดาห์"],
    ["อายุสัญญา"],
    ["ระยะผ่อนผัน"],
    ["วันครบสัญญา"],
    ["เลขรอบล่าสุด"],
    ["รอบล่าสุด"],
    ["รอบถัดไป"],
    ["จำนวนเดือนจริง"],
    ["จำนวนเดือนที่คิด"],
    ["วันเกินจากรอบล่าสุด"],
    ["วันเกินจากครบสัญญา"],
    ["ไถ่ของถูกบล็อก"],
    ["สถานะสัญญา"],
    ["โหมดคำนวณ"],
    ["อัตราที่ใช้"],
    ["วันที่เกินที่แสดง"],
    ["ดอกเบี้ย"],
    ["วิธีคิด"],
    ["สูตร"],
    ["ระยะเวลาทั้งสิ้น"],
    ["ตรวจข้อมูล"],
]
calculator.getRange("C14:C36").values = [
    ["เลือกจากโปรโมชัน"],
    ["ใช้เมื่อ ต่อดอก เกินครบสัญญามากกว่า 20 วัน"],
    ["ใช้เมื่อ ไถ่ของ เกินรอบล่าสุด 1-7 วัน"],
    ["เดือน"],
    ["วัน หลังครบสัญญา"],
    ["startDate + 3 เดือน แบบ calendar anniversary"],
    ["รอบที่มากที่สุดซึ่งวันครบรอบไม่เกินวันที่ทำรายการ"],
    ["วันครบรอบล่าสุด"],
    ["วันครบรอบถัดไป"],
    ["นับเฉพาะเดือนเต็มตามวันครบรอบจริง"],
    ["ถ้าเลยรอบแม้ 1 วัน คิดเป็นเดือนถัดไป"],
    ["ใช้กับกติกา ไถ่ของ รายสัปดาห์"],
    ["ใช้กับบล็อกไถ่ของและอัตราปรับต่อดอก"],
    ["เฉพาะรายการ ไถ่ของ"],
    ["ดูจากวันเกินหลังครบสัญญา"],
    ["ไถ่ของ 1-7 วัน = เดือนจริงตามโปร + 1%; ไถ่ของ 0 หรือ >7 วัน = เดือนที่คิดตามโปร"],
    ["ข้อความสำหรับผลลัพธ์"],
    ["ต่อดอกหลังครบสัญญาใช้วันเกินจากครบสัญญา"],
    ["ไถ่ของ 1-7 ใช้เดือนจริงตามโปร + 1%; ไถ่ของ 0 หรือ >7 ใช้เดือนที่คิดตามโปร"],
    ["คำอธิบายสั้น"],
    ["สูตรที่เว็บควรใช้"],
    ["เดือนเต็มตามวันครบรอบ + วันหลังรอบล่าสุด"],
    ["แจ้งข้อผิดพลาดของ input"],
]
calculator.getRange("B14:B36").formulas = [
    ['=SWITCH($B$6,"โปร 2%",2%,"โปรแสน (1.5%)",1.5%,0)'],
    ["=3%"],
    ["=1%"],
    ["=3"],
    ["=20"],
    ['=IF($B$4="","",INDEX($K$4:$K$40,MATCH($B$17,$J$4:$J$40,0)))'],
    [
        '=IF(OR($B$4="",$B$8<$B$4),"",MAXIFS($J$4:$J$40,$K$4:$K$40,"<="&$B$8))',
    ],
    ['=IF($B$4="","",INDEX($K$4:$K$40,MATCH($B$20,$J$4:$J$40,0)))'],
    [
        '=IF($B$4="","",INDEX($K$4:$K$40,MATCH($B$20+1,$J$4:$J$40,0)))',
    ],
    ['=IF($B$4="","",$B$20)'],
    ['=IF($B$4="","",IF($B$8=$B$21,$B$20,$B$20+1))'],
    ['=IF($B$4="","",MAX(0,$B$8-$B$21))'],
    ['=IF($B$19="","",IF($B$8>$B$19,MAX(0,$B$8-$B$19),0))'],
    ['=AND($B$7="ไถ่ของ",$B$26>$B$18)'],
    [
        '=IF($B$26=0,"ภายในระยะเวลา",IF($B$26<=$B$18,"เกินกำหนดไม่เกิน 20 วัน","เกินกำหนด"))',
    ],
    [
        '=IF($B$27,"blocked",IF(AND($B$7="ไถ่ของ",$B$25>0,$B$25<=7),"weeklyOnePercent",IF(AND($B$7="ต่อดอก",$B$26>$B$18),"penaltyThreePercent","monthlyPromo")))',
    ],
    [
        '=SWITCH($B$29,"blocked","-","weeklyOnePercent",TEXT($B$14,"0.##%")&" ต่อเดือน + 1%","penaltyThreePercent","3% ต่อเดือน","monthlyPromo",TEXT($B$14,"0.##%")&" ต่อเดือน")',
    ],
    ['=IF(AND($B$7="ต่อดอก",$B$26>0),$B$26,$B$25)'],
    [
        '=IF($B$29="blocked","",ROUNDUP(IF($B$29="weeklyOnePercent",($B$5*$B$23*$B$14)+($B$5*$B$16),$B$5*SWITCH($B$29,"penaltyThreePercent",$B$15,"monthlyPromo",$B$14,$B$14)*$B$24),0))',
    ],
    [
        '=SWITCH($B$29,"blocked","ไม่สามารถไถ่ได้","weeklyOnePercent","คิดเดือนจริง โปร "&TEXT($B$14,"0.##%")&" + รายสัปดาห์ 1%","penaltyThreePercent","เกินกำหนด ใช้อัตรา 3%","monthlyPromo",IF($B$25>0,"ปัดเต็มเดือน โปร "&TEXT($B$14,"0.##%"),"คิดเดือนจริง โปร "&TEXT($B$14,"0.##%")))',
    ],
    [
        '=IF($B$29="blocked","ไม่มีการคำนวณดอกเบี้ย",IF($B$29="weeklyOnePercent",TEXT($B$5,"#,##0")&" × "&TEXT($B$14,"0.##%")&" × "&$B$23&" เดือน + "&TEXT($B$5,"#,##0")&" × 1%",TEXT($B$5,"#,##0")&" × "&TEXT(SWITCH($B$29,"penaltyThreePercent",$B$15,"monthlyPromo",$B$14,$B$14),"0.##%")&" × "&$B$24&" เดือน"))',
    ],
    ['=IF($B$4="","",$B$20&" เดือน "&$B$25&" วัน")'],
    [
        '=TEXTJOIN(" | ",TRUE,IF($B$4="","กรุณาเลือกวันเริ่ม",""),IF($B$5<=0,"ยอดจำนำต้องมากกว่า 0",""),IF($B$8<$B$4,"วันที่วันนี้ต้องไม่ก่อนวันเริ่ม",""))',
    ],
]

for (let row = 4; row <= 40; row += 1) {
    calculator.getRange(`J${row}`).values = [[row - 4]]
    if (row === 4) {
        calculator.getRange(`K${row}`).formulas = [['=IF($B$4="","",$B$4)']]
    } else {
        calculator.getRange(`K${row}`).formulas = [
            [anniversaryFormula("$B$4", `J${row}`)],
        ]
    }
    calculator.getRange(`L${row}`).formulas = [
        [`=IF(OR($K${row}="",$B$8<$K${row}),"",MAX(0,$B$8-$K${row}))`],
    ]
}

calculator.getRange("H3").values = [["วิธีอ่านชีต"]]
calculator.getRange("H4:H10").values = [
    ["1. แก้ช่องสีครีม B4:B8 เพื่อทดสอบ"],
    ["2. ดูผลลัพธ์หลักที่ D4:E14"],
    ["3. ตรวจสูตรละเอียดที่ A14:C36"],
    ["4. ตาราง J:L คือรอบครบรอบรายเดือน"],
    ["5. สูตรไม่หารจำนวนวันด้วย 30"],
    ["6. สูตรใช้วันครบรอบตามปฏิทิน"],
    ["7. ถ้ากติกาเปลี่ยน ให้แก้สูตรแถว 14-36"],
]

calculator.getRange("A1").format.font.size = 18
calculator.getRange("A1").format.font.bold = true
calculator.getRange("A1").format.font.color = "#F5C84C"
setFill(calculator.getRange("A1:L2"), "#7A0708")
calculator.getRange("A2").format.font.color = "#F4E4C3"

for (const address of ["A3:B3", "D3:F3", "A13:C13", "J3:L3", "H3"]) {
    setFill(calculator.getRange(address), "#8F0A0B")
    setFont(calculator.getRange(address), { bold: true, color: "#F5C84C" })
}

setFill(calculator.getRange("A4:A9"), "#F8ECD1")
setFill(calculator.getRange("B4:B8"), "#FFF8E8")
setFill(calculator.getRange("B9"), "#F6E7C4")
setFill(calculator.getRange("D4:D14"), "#F8ECD1")
setFill(calculator.getRange("E4:E14"), "#FFF8E8")
setFill(calculator.getRange("A14:A36"), "#F8ECD1")
setFill(calculator.getRange("B14:B36"), "#FFF8E8")
setFill(calculator.getRange("C14:C36"), "#F6E7C4")
setFill(calculator.getRange("H4:H10"), "#FFF8E8")
setFill(calculator.getRange("J4:L40"), "#FFFDF6")

setFont(calculator.getRange("D4:E4"), { bold: true, color: "#6F0607" })
calculator.getRange("E4").format.font.size = 16
calculator.getRange("E4").format.font.bold = true

calculator.getRange("B4").setNumberFormat("dd/mm/yyyy")
calculator.getRange("B8").setNumberFormat("dd/mm/yyyy")
calculator.getRange("B19").setNumberFormat("dd/mm/yyyy")
calculator.getRange("B20").setNumberFormat("0")
calculator.getRange("B21:B22").setNumberFormat("dd/mm/yyyy")
calculator.getRange("B23:B24").setNumberFormat("0")
calculator.getRange("K4:K40").setNumberFormat("dd/mm/yyyy")
calculator.getRange("B5").setNumberFormat("#,##0")
calculator.getRange("B14:B16").setNumberFormat("0.00%")
calculator.getRange("B32").setNumberFormat("#,##0")
calculator.getRange("E4").setNumberFormat("#,##0")

calculator.getRange("B6").dataValidation = {
    rule: { type: "list", values: ["โปร 2%", "โปรแสน (1.5%)"] },
}
calculator.getRange("B7").dataValidation = {
    rule: { type: "list", values: ["ต่อดอก", "ไถ่ของ"] },
}

calculator.getRange("A1:L40").format.font.name = "Arial"
calculator.getRange("A1:L40").format.font.color = "#3F1E08"
calculator.getRange("A1:L40").format.wrapText = true
calculator.getRange("A1:L40").format.verticalAlignment = "Top"
calculator.getRange("A4:L40").format.font.size = 10
calculator.getRange("B4:B8").format.font.bold = true

calculator.getRange("A1").format.font.size = 18
calculator.getRange("A1").format.font.bold = true
calculator.getRange("A1").format.font.color = "#F5C84C"
calculator.getRange("A2").format.font.color = "#F4E4C3"
for (const address of ["A3:B3", "D3:F3", "A13:C13", "J3:L3", "H3"]) {
    setFont(calculator.getRange(address), { bold: true, color: "#F5C84C" })
}

for (const address of [
    "A3:B9",
    "D3:F14",
    "A13:C36",
    "H3:H10",
    "J3:L40",
]) {
    setBorder(calculator.getRange(address), "#E5C16A")
}

calculator.freezePanes.freezeRows(3)

calculator.getRange("A:A").format.columnWidthPx = 180
calculator.getRange("B:B").format.columnWidthPx = 160
calculator.getRange("C:C").format.columnWidthPx = 300
calculator.getRange("D:D").format.columnWidthPx = 170
calculator.getRange("E:E").format.columnWidthPx = 240
calculator.getRange("F:F").format.columnWidthPx = 24
calculator.getRange("H:H").format.columnWidthPx = 280
calculator.getRange("J:J").format.columnWidthPx = 72
calculator.getRange("K:K").format.columnWidthPx = 130
calculator.getRange("L:L").format.columnWidthPx = 130
calculator.getRange("1:2").format.rowHeightPx = 34
calculator.getRange("9:14").format.rowHeightPx = 32
calculator.getRange("4:40").format.rowHeightPx = 24

const cases = workbook.worksheets.add("Review Cases")
cases.showGridLines = false
cases.getRange("A1:I1").merge()
cases.getRange("A1").values = [["ตัวอย่างเคสสำหรับตรวจตรรกะ"]]
cases.getRange("A2:I2").merge()
cases.getRange("A2").values = [
    [
        "ตารางนี้เป็นชุดตัวอย่างจากกติกา เพื่อใช้เทียบกับชีต Calculator และคุยกันว่าต้องปรับสูตรตรงไหน",
    ],
]
cases.getRange("A4:I4").values = [
    [
        "เคส",
        "วันเริ่ม",
        "วันที่ทำรายการ",
        "โปร",
        "รายการ",
        "ผลที่ควรเห็น",
        "เดือน",
        "วันเกิน",
        "หมายเหตุ",
    ],
]
cases.getRange("A5:I12").values = [
    [
        "ครบ 1 เดือนพอดี",
        new Date(2024, 5, 10),
        new Date(2024, 6, 10),
        "โปร 2%",
        "ต่อดอก",
        "คิด 1 เดือน",
        1,
        0,
        "10 มิ.ย. ถึง 10 ก.ค.",
    ],
    [
        "เลยรอบ 1 วัน",
        new Date(2024, 5, 10),
        new Date(2024, 6, 11),
        "โปร 2%",
        "ต่อดอก",
        "คิด 2 เดือน",
        2,
        1,
        "เริ่มรอบใหม่แม้เลย 1 วัน",
    ],
    [
        "สิ้นเดือน ก.พ. ปีอธิกสุรทิน",
        new Date(2024, 0, 31),
        new Date(2024, 1, 29),
        "โปร 2%",
        "ต่อดอก",
        "ครบรอบ 29/02/2024",
        1,
        0,
        "fallback วันสุดท้ายของเดือน",
    ],
    [
        "ไถ่ของ เกิน 5 วัน",
        new Date(2026, 3, 10),
        new Date(2026, 4, 15),
        "โปรแสน (1.5%)",
        "ไถ่ของ",
        "คิดเดือนจริง โปร 1.5% + รายสัปดาห์ 1%",
        1,
        5,
        "ใช้ loan × 1 เดือนจริง × โปร + loan × 1%",
    ],
    [
        "ไถ่ของ เกิน 8 วัน",
        new Date(2026, 3, 10),
        new Date(2026, 4, 18),
        "โปรแสน (1.5%)",
        "ไถ่ของ",
        "ปัดเต็มเดือน โปร 1.5%",
        2,
        8,
        "ไม่มี 2 หรือ 3 สัปดาห์",
    ],
    [
        "ต่อดอก เกินครบสัญญา 21 วัน",
        new Date(2026, 0, 10),
        new Date(2026, 4, 1),
        "โปร 2%",
        "ต่อดอก",
        "ใช้อัตรา 3%",
        4,
        21,
        "โปรโมชันหมดสิทธิ์",
    ],
    [
        "ไถ่ของ เกินครบสัญญา 21 วัน",
        new Date(2026, 0, 10),
        new Date(2026, 4, 1),
        "โปร 2%",
        "ไถ่ของ",
        "ไม่สามารถไถ่ได้",
        "",
        21,
        "ของหลุดสิทธิ์แล้ว",
    ],
    [
        "ตัวอย่างปัจจุบัน",
        new Date(2026, 3, 27),
        new Date(2026, 4, 11),
        "โปรแสน (1.5%)",
        "ไถ่ของ",
        "ปัดเต็มเดือน โปร 1.5%",
        1,
        14,
        "รอบล่าสุด 27/04/2026",
    ],
]
setFill(cases.getRange("A1:I2"), "#7A0708")
cases.getRange("A1").format.font.color = "#F5C84C"
cases.getRange("A1").format.font.bold = true
cases.getRange("A1").format.font.size = 18
cases.getRange("A2").format.font.color = "#F4E4C3"
setFill(cases.getRange("A4:I4"), "#8F0A0B")
setFont(cases.getRange("A4:I4"), { bold: true, color: "#F5C84C" })
setFill(cases.getRange("A5:I12"), "#FFFDF6")
cases.getRange("B5:C12").setNumberFormat("dd/mm/yyyy")
cases.getRange("A1:I12").format.font.name = "Arial"
cases.getRange("A1:I12").format.font.color = "#3F1E08"
cases.getRange("A1:I12").format.wrapText = true
setBorder(cases.getRange("A4:I12"), "#E5C16A")
cases.freezePanes.freezeRows(4)
cases.getRange("A:A").format.columnWidthPx = 210
cases.getRange("B:C").format.columnWidthPx = 120
cases.getRange("D:E").format.columnWidthPx = 120
cases.getRange("F:F").format.columnWidthPx = 190
cases.getRange("G:H").format.columnWidthPx = 80
cases.getRange("I:I").format.columnWidthPx = 260

const summary = await workbook.inspect({
    kind: "table",
    range: "Calculator!A1:L40",
    include: "values,formulas",
    tableMaxRows: 40,
    tableMaxCols: 12,
    maxChars: 8000,
})
console.log(summary.ndjson)

const errors = await workbook.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 100 },
    summary: "formula error scan",
})
console.log(errors.ndjson)

await fs.mkdir(outputDir, { recursive: true })
const preview = await workbook.render({
    sheetName: "Calculator",
    range: "A1:L40",
    scale: 1,
    format: "png",
})
await fs.writeFile(
    path.join(outputDir, "calculator-preview.png"),
    new Uint8Array(await preview.arrayBuffer())
)

const output = await SpreadsheetFile.exportXlsx(workbook)
await output.save(outputPath)
console.log(outputPath)
