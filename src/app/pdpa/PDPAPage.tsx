'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import localFont from 'next/font/local';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useConsent } from '../contexts/pdpa';
import { useActionCared } from '../contexts/action-cared';
import { useLanguage } from '@/app/contexts/LanguageProvider';
import translations from '@/app/components/translations';

const promptFont = localFont({
  src: [
    { path: '../../../public/fonts/Prompt-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../../../public/fonts/Prompt-Medium.ttf', weight: '500', style: 'normal' },
    { path: '../../../public/fonts/Prompt-Bold.ttf', weight: '700', style: 'normal' },
  ],
});

const sawarabiFont = localFont({
  src: [{ path: '../../../public/fonts/SawarabiGothic-Regular.ttf', weight: '400', style: 'normal' }],
});

// const defaultTranslations = {
  TH: {
    title: 'นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคล (PDPA)',
    back: 'ย้อนกลับ',
    acceptLabel:
      'ข้าพเจ้ายินยอมให้มีการจัดเก็บและประมวลผลข้อมูลส่วนบุคคลของฉัน ตามนโยบายความเป็นส่วนตัวฉบับนี้',
    acceptButton: 'ยอมรับ',
    content: `
      <h2 class="text-xl font-bold mb-4">นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคล</h2>
      <p class="mb-4">
        บริษัท ออลต์ ดีไซน์ ออฟฟิศ จำกัด (ต่อไปนี้เรียกว่า “บริษัท”) ได้จัดทำนโยบายความเป็นส่วนตัวนี้
        (ต่อไปนี้เรียกว่า “นโยบาย”) เพื่ออธิบายวิธีการจัดการข้อมูลส่วนบุคคลของผู้ใช้บนเว็บไซต์ที่บริษัทเป็นผู้ดำเนินการ
        (ต่อไปนี้เรียกว่า “เว็บไซต์”) รวมถึงบริการต่าง ๆ ที่บริษัทให้บริการ (ต่อไปนี้เรียกว่า “บริการ”)
      </p>
      <p class="mb-4">
        ในกรณีที่กฎหมายคุ้มครองข้อมูลส่วนบุคคลแห่งราชอาณาจักรไทย (“PDPA”) ใช้บังคับ
        โปรดดูข้อกำหนดเฉพาะสำหรับประเทศไทยเพิ่มเติมด้านล่าง
      </p>

      <h3 class="text-lg font-semibold mb-2 mt-6">ข้อ 1 (ข้อมูลส่วนบุคคล)</h3>
      <p class="mb-4">
        “ข้อมูลส่วนบุคคล” หมายถึง “ข้อมูลส่วนบุคคล” ตามที่ระบุไว้ในกฎหมายคุ้มครองข้อมูลส่วนบุคคลของประเทศญี่ปุ่น
        และหมายถึงข้อมูลเกี่ยวกับบุคคลซึ่งยังมีชีวิตอยู่ที่สามารถใช้ระบุตัวตนบุคคลได้ เช่น ชื่อ วันเดือนปีเกิด
        ที่อยู่ หมายเลขโทรศัพท์ ข้อมูลติดต่อ หรือข้อมูลอื่น ๆ และรวมถึงข้อมูลลักษณะทางกายภาพ ลายนิ้วมือ เสียง
        และข้อมูลบนบัตรประกันสุขภาพที่สามารถใช้ระบุตัวตนได้ด้วยตัวข้อมูลเอง (Personally Identifiable Information)
      </p>

      <h3 class="text-lg font-semibold mb-2 mt-6">ข้อ 2 (วิธีเก็บข้อมูลส่วนบุคคล)</h3>
      <p class="mb-4">
        เมื่อผู้ใช้ใช้บริการ บริษัทอาจขอข้อมูลส่วนบุคคล เช่น ชื่อ วันเกิด ที่อยู่ หมายเลขโทรศัพท์ อีเมล
        หมายเลขบัญชีธนาคาร หมายเลขบัตรเครดิต และหมายเลขใบขับขี่
      </p>
      <p class="mb-4">
        บริษัทอาจรับข้อมูลธุรกรรมและข้อมูลการชำระเงินจากพันธมิตรของบริษัท (เช่น ผู้ให้บริการข้อมูล ผู้ลงโฆษณา
        และปลายทางจัดส่งโฆษณา; ต่อไปนี้เรียกว่า “พันธมิตร”) ซึ่งมีข้อมูลส่วนบุคคลของผู้ใช้
        รวมถึงข้อมูลธุรกรรมระหว่างผู้ใช้และพันธมิตรดังกล่าว
      </p>

      <h3 class="text-lg font-semibold mb-2 mt-6">
        ข้อ 3 (วัตถุประสงค์ในการเก็บและใช้ข้อมูลส่วนบุคคล)
      </h3>
      <p class="mb-2">บริษัทใช้งานข้อมูลส่วนบุคคลเพื่อวัตถุประสงค์ดังต่อไปนี้:</p>
      <ul class="list-disc pl-6 mb-4 space-y-1">
        <li>ให้บริการและดำเนินการบริการ</li>
        <li>ตอบกลับคำถามของผู้ใช้ (รวมถึงการยืนยันตัวตน)</li>
        <li>ส่งอีเมลเกี่ยวกับฟีเจอร์ใหม่ การอัปเดต แคมเปญ หรือข้อมูลบริการอื่นที่ผู้ใช้ใช้อยู่</li>
        <li>ติดต่อผู้ใช้ในกรณีจำเป็น เช่น การบำรุงรักษาหรือประกาศสำคัญ</li>
        <li>ระบุตัวผู้ใช้ที่ละเมิดข้อกำหนดการใช้งาน หรือพยายามใช้บริการอย่างทุจริต และปฏิเสธการใช้บริการ</li>
        <li>เปิดให้ผู้ใช้ดู แก้ไข หรือลบข้อมูลบัญชีของตน รวมถึงตรวจสอบสถานะการใช้งาน</li>
        <li>เรียกเก็บค่าบริการในบริการที่ต้องชำระเงิน</li>
        <li>ใช้เพื่อวัตถุประสงค์อื่นที่เกี่ยวข้องกับข้อข้างต้น</li>
      </ul>

      <h3 class="text-lg font-semibold mb-2 mt-6">
        ข้อ 4 (การเปลี่ยนแปลงวัตถุประสงค์การใช้ข้อมูล)
      </h3>
      <p class="mb-4">
        บริษัทสามารถเปลี่ยนแปลงวัตถุประสงค์การใช้ข้อมูลได้ หากมีเหตุอันสมควรว่าเกี่ยวข้องกับวัตถุประสงค์เดิม
        และการเปลี่ยนแปลงดังกล่าวจะถูกแจ้งให้ผู้ใช้ทราบหรือประกาศบนเว็บไซต์
      </p>

      <h3 class="text-lg font-semibold mb-2 mt-6">
        ข้อ 5 (การให้ข้อมูลส่วนบุคคลแก่บุคคลที่สาม)
      </h3>
      <p class="mb-2">
        บริษัทจะไม่เปิดเผยข้อมูลส่วนบุคคลแก่บุคคลที่สามโดยไม่ได้รับความยินยอม เว้นแต่มีข้อยกเว้นดังต่อไปนี้
        หรือเป็นไปตามที่กฎหมายกำหนด
      </p>
      <ul class="list-disc pl-6 mb-4 space-y-1">
        <li>เมื่อจำเป็นเพื่อป้องกันอันตรายต่อชีวิต ร่างกาย หรือทรัพย์สิน และไม่สามารถขอความยินยอมได้</li>
        <li>เมื่อจำเป็นเพื่อสาธารณสุขหรือพัฒนาการเด็ก และไม่สามารถขอความยินยอมได้</li>
        <li>
          เมื่อจำเป็นต้องให้ความร่วมมือกับหน่วยงานรัฐเพื่อดำเนินงานตามกฎหมาย
          และการขอความยินยอมอาจเป็นอุปสรรคต่อการดำเนินการดังกล่าว
        </li>
        <li>
          กรณีที่บริษัทเผยแพร่ล่วงหน้าและยื่นแจ้งต่อคณะกรรมาธิการคุ้มครองข้อมูลส่วนบุคคล
          เกี่ยวกับการให้ข้อมูลส่วนบุคคลแก่บุคคลที่สาม ประเภทข้อมูล วิธีการให้ข้อมูล สิทธิในการระงับ
          และวิธีการขอระงับการให้ข้อมูล
        </li>
      </ul>
      <p class="mb-2">กรณีต่อไปนี้จะไม่ถือว่าเป็น “บุคคลที่สาม”:</p>
      <ul class="list-disc pl-6 mb-4 space-y-1">
        <li>การมอบหมายงานให้ผู้ให้บริการภายนอก</li>
        <li>การโอนกิจการ (เช่น การควบรวมกิจการหรือโอนกิจการทั้งหมดหรือบางส่วน)</li>
        <li>
          การใช้ข้อมูลร่วมกับบุคคลที่กำหนด และมีการแจ้งรายละเอียดให้เจ้าของข้อมูลทราบล่วงหน้า
          ตามที่กฎหมายกำหนด
        </li>
      </ul>

      <h3 class="text-lg font-semibold mb-2 mt-6">ข้อ 6 (การเปิดเผยข้อมูลส่วนบุคคล)</h3>
      <p class="mb-2">
        บริษัทจะเปิดเผยข้อมูลส่วนบุคคลให้เจ้าของข้อมูลเมื่อมีการร้องขอ เว้นแต่มีเหตุผลดังต่อไปนี้:
      </p>
      <ul class="list-disc pl-6 mb-4 space-y-1">
        <li>อาจเกิดอันตรายต่อชีวิต ร่างกาย ทรัพย์สิน หรือสิทธิอื่นใดของเจ้าของข้อมูลหรือบุคคลที่สาม</li>
        <li>อาจกระทบต่อการดำเนินธุรกิจของบริษัทอย่างมีนัยสำคัญ</li>
        <li>เป็นการขัดต่อกฎหมายหรือข้อบังคับที่เกี่ยวข้อง</li>
      </ul>
      <p class="mb-4">
        บริษัทอาจเรียกเก็บค่าธรรมเนียมในการเปิดเผยข้อมูลในอัตรา 1,000 เยนต่อคำขอ
        ทั้งนี้ ข้อมูลประวัติหรือข้อมูลเชิงสถิติที่ไม่สามารถระบุตัวบุคคลได้จะไม่ถือเป็นข้อมูลที่ต้องเปิดเผย
      </p>

      <h3 class="text-lg font-semibold mb-2 mt-6">
        ข้อ 7 (การแก้ไข หรือลบข้อมูลส่วนบุคคล)
      </h3>
      <p class="mb-4">
        ผู้ใช้สามารถขอให้บริษัทแก้ไข เพิ่มเติม หรือลบข้อมูลส่วนบุคคลของตนได้
        ในกรณีที่พบว่าข้อมูลไม่ถูกต้องหรือไม่สมบูรณ์ บริษัทจะดำเนินการแก้ไขตามความเหมาะสม
        และจะแจ้งผลให้ผู้ใช้ทราบโดยเร็ว
      </p>

      <h3 class="text-lg font-semibold mb-2 mt-6">
        ข้อ 8 (การระงับการใช้ข้อมูลส่วนบุคคล)
      </h3>
      <p class="mb-2">
        บริษัทจะตรวจสอบโดยเร็วหากมีข้อสงสัยหรือคำร้องเรียนว่าข้อมูลส่วนบุคคลถูก:
      </p>
      <ul class="list-disc pl-6 mb-4 space-y-1">
        <li>ใช้นอกเหนือจากวัตถุประสงค์ที่ระบุไว้</li>
        <li>เก็บรวบรวมด้วยวิธีการที่ไม่ชอบด้วยกฎหมาย</li>
        <li>ใช้ในทางที่อาจสนับสนุนการกระทำผิดกฎหมาย</li>
        <li>เก็บรักษาไว้นานเกินความจำเป็นตามวัตถุประสงค์</li>
        <li>เกิดเหตุรั่วไหล สูญหาย หรือถูกเข้าถึงโดยไม่ได้รับอนุญาต</li>
        <li>ใช้ในลักษณะที่อาจละเมิดสิทธิหรือเสรีภาพของเจ้าของข้อมูล</li>
      </ul>
      <p class="mb-4">
        หากพบความจำเป็น บริษัทจะระงับการใช้ หรือลบข้อมูลดังกล่าว และจะแจ้งให้ผู้ใช้ทราบ
        หากการระงับการใช้ข้อมูลทำได้ยาก บริษัทจะใช้มาตรการทดแทนที่เหมาะสมตามสมควร
      </p>

      <h3 class="text-lg font-semibold mb-2 mt-6">
        ข้อ 9 (การเปลี่ยนแปลงนโยบายความเป็นส่วนตัว)
      </h3>
      <p class="mb-4">
        บริษัทสามารถปรับปรุงหรือแก้ไขนโยบายนี้ได้โดยไม่ต้องแจ้งผู้ใช้ล่วงหน้า เว้นแต่กฎหมายจะกำหนดเป็นอย่างอื่น
        นโยบายฉบับแก้ไขจะมีผลเมื่อมีการเผยแพร่บนเว็บไซต์ของบริษัท
      </p>

      <h3 class="text-lg font-semibold mb-2 mt-6">
        ข้อกำหนดเพิ่มเติมสำหรับประเทศไทย (Thailand Regulations)
      </h3>
      <p class="mb-4">
        ส่วนนี้เป็นข้อกำหนดเพิ่มเติมตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล (“PDPA”)
        และในกรณีที่มีความขัดแย้งกับเนื้อหาหลัก ข้อกำหนดในส่วนนี้จะมีผลบังคับใช้ก่อน
      </p>

      <h4 class="text-base font-semibold mb-2 mt-4">การจัดการข้อมูลส่วนบุคคล</h4>
      <p class="mb-4">
        วิธีการจัดการ ระยะเวลาการจัดเก็บ หมวดข้อมูลส่วนบุคคล
        และการเปิดเผยแก่บุคคลที่สามเป็นไปตามที่ระบุไว้ในนโยบายหลักด้านบน
      </p>

      <h4 class="text-base font-semibold mb-2 mt-4">ฐานทางกฎหมาย</h4>
      <p class="mb-2">
        โดยทั่วไป บริษัทใช้ความยินยอมของผู้ใช้เป็นฐานทางกฎหมายในการประมวลผลข้อมูลส่วนบุคคล
        ในกรณีที่ไม่สามารถขอความยินยอมได้อย่างเหมาะสม ฐานทางกฎหมายอาจเป็นดังต่อไปนี้:
      </p>
      <ul class="list-disc pl-6 mb-4 space-y-1">
        <li>ความจำเป็นในการทำสัญญา หรือเพื่อดำเนินการตามคำขอของผู้ใช้ก่อนทำสัญญา</li>
        <li>ประโยชน์โดยชอบธรรมของบริษัทหรือบุคคลอื่น</li>
        <li>การปฏิบัติตามกฎหมายหรือข้อบังคับที่บังคับใช้</li>
      </ul>
      <p class="mb-2">ตัวอย่างผลประโยชน์โดยชอบธรรม เช่น:</p>
      <ul class="list-disc pl-6 mb-4 space-y-1">
        <li>การเพิ่มประสิทธิภาพทางธุรกิจผ่านการปรับปรุงบริการ</li>
        <li>การเพิ่มความสะดวกและความปลอดภัยในการใช้งานเว็บไซต์และบริการของบริษัท</li>
      </ul>

      <h4 class="text-base font-semibold mb-2 mt-4">การโอนข้อมูลข้ามพรมแดน</h4>
      <p class="mb-4">
        บริษัทอาจโอนข้อมูลส่วนบุคคลไปยังประเทศญี่ปุ่นหรือประเทศอื่นเมื่อจำเป็นตามสัญญา
        หรือเพื่อการให้บริการ โดยจะใช้มาตรการรักษาความปลอดภัยที่เหมาะสมตามที่กฎหมายกำหนด
      </p>

      <h4 class="text-base font-semibold mb-2 mt-4">สิทธิของผู้ใช้ (ตาม PDPA)</h4>
      <p class="mb-2">ผู้ใช้มีสิทธิตามกฎหมาย ดังต่อไปนี้:</p>
      <ul class="list-disc pl-6 mb-4 space-y-1">
        <li>ขอเข้าถึงข้อมูลส่วนบุคคลของตน</li>
        <li>ขอให้แก้ไขข้อมูลที่ไม่ถูกต้องหรือไม่สมบูรณ์</li>
        <li>ขอให้ลบข้อมูลส่วนบุคคลในบางกรณี</li>
        <li>จำกัดการประมวลผลข้อมูลส่วนบุคคล</li>
        <li>คัดค้านการประมวลผลข้อมูลส่วนบุคคลในบางกรณี</li>
        <li>ขอรับและโอนย้ายข้อมูล (Data Portability) หากมีสิทธิ์ตามกฎหมาย</li>
      </ul>
      <p class="mb-4">
        ผู้ใช้สามารถขอใช้สิทธิดังกล่าวได้ผ่านช่องทางการติดต่อที่บริษัทระบุ
        โดยบริษัทจะดำเนินการตามคำขอภายในระยะเวลาที่เหมาะสมตามที่กฎหมายกำหนด
      </p>

      <h4 class="text-base font-semibold mb-2 mt-4">การถอนความยินยอม</h4>
      <p class="mb-4">
        ผู้ใช้สามารถถอนความยินยอมในการประมวลผลข้อมูลส่วนบุคคลได้ทุกเมื่อ
        โดยไม่กระทบต่อความชอบด้วยกฎหมายของการประมวลผลที่ได้ดำเนินการไปแล้วก่อนการถอนความยินยอม
      </p>

      <h4 class="text-base font-semibold mb-2 mt-4">สิทธิในการร้องเรียนต่อหน่วยงานกำกับดูแล</h4>
      <p class="mb-4">
        ผู้ใช้มีสิทธิร้องเรียนต่อหน่วยงานกำกับดูแลที่มีอำนาจในประเทศไทย
        หรือหน่วยงานกำกับดูแลในระดับสากล ตามที่กฎหมายที่เกี่ยวข้องกำหนด
      </p>

      <h4 class="text-base font-semibold mb-2 mt-4">ข้อมูลส่วนบุคคลที่จำเป็นในการให้บริการ</h4>
      <p class="mb-2">ตัวอย่างข้อมูลที่อาจจำเป็นในการให้บริการ ได้แก่:</p>
      <ul class="list-disc pl-6 mb-4 space-y-1">
        <li>ข้อมูลพื้นฐาน เช่น ชื่อบริษัท ชื่อบุคคลผู้ติดต่อ หมายเลขโทรศัพท์</li>
        <li>ข้อมูลทั้งหมดที่จำเป็นต่อการออกแบบ ผลิต หรือพัฒนาเว็บไซต์และบริการที่เกี่ยวข้อง</li>
      </ul>

      <h4 class="text-base font-semibold mb-2 mt-4">
        การตัดสินใจโดยอัตโนมัติ (รวมถึงการทำโปรไฟล์)
      </h4>
      <p class="mb-4">
        บริษัทจะไม่ตัดสินใจใด ๆ โดยอาศัยระบบอัตโนมัติ 100% รวมถึงการทำโปรไฟล์
        ที่ส่งผลกระทบอย่างมีนัยสำคัญต่อสิทธิหรือเสรีภาพของผู้ใช้
      </p>
    `,
  },
  JP: {
    title: 'プライバシーポリシーおよび個人情報保護方針（PDPA）',
    back: '戻る',
    acceptLabel: '本プライバシーポリシーおよびPDPAに基づく個人情報の取扱いに同意します。',
    acceptButton: '同意する',
    content: `
      <h2 class="text-xl font-bold mb-4">プライバシーポリシー</h2>
      <p class="mb-4">
        株式会社オルトデザインオフィスおよびAlt Design Office Co,.Ltd.（以下，「当社」といいます。）は，
        当社の運営するウェブサイト（以下，「本ウェブサイト」といいます。）および当社が提供するサービス
        （以下，「当社サービス」といいます。）におけるユーザーの個人情報の取扱いについて，
        以下のとおりプライバシーポリシー（以下，「本ポリシー」といいます。）を定めます。
      </p>
      <p class="mb-4">
        なお、タイ王国が定める個人データ保護法（Personal Data Protection Act、以下、PDPAといいます。）が
        適用される場合には、タイ王国における当社の規定も併せてご確認ください。
      </p>

      <h3 class="text-lg font-semibold mb-2 mt-6">第1条（個人情報）</h3>
      <p class="mb-4">
        「個人情報」とは，個人情報保護法にいう「個人情報」を指すものとし，生存する個人に関する情報であって，
        当該情報に含まれる氏名，生年月日，住所，電話番号，連絡先その他の記述等により特定の個人を識別できる情報
        及び容貌，指紋，声紋にかかるデータ，及び健康保険証の保険者番号などの当該情報単体から特定の個人を識別できる情報
        （個人識別情報）を指します。
      </p>

      <h3 class="text-lg font-semibold mb-2 mt-6">第2条（個人情報の収集方法）</h3>
      <p class="mb-4">
        当社は，ユーザーが当社サービスをご利用になる際に、氏名，生年月日，住所，電話番号，メールアドレス，
        銀行口座番号，クレジットカード番号，運転免許証番号などの個人情報をお尋ねすることがあります。
        また，ユーザーと提携先などとの間でなされたユーザーの個人情報を含む取引記録や決済に関する情報を，
        当社の提携先（情報提供元，広告主，広告配信先などを含みます。以下，「提携先」といいます。）などから
        収集することがあります。
      </p>

      <h3 class="text-lg font-semibold mb-2 mt-6">第3条（個人情報を収集・利用する目的）</h3>
      <p class="mb-2">当社が個人情報を収集・利用する目的は，以下のとおりです。</p>
      <ul class="list-disc pl-6 mb-4 space-y-1">
        <li>当社サービスの提供・運営のため</li>
        <li>ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）</li>
        <li>ユーザーが利用中のサービスの新機能，更新情報，キャンペーン等および当社が提供する他のサービスの案内メールを送付するため</li>
        <li>メンテナンス，重要なお知らせなど必要に応じたご連絡のため</li>
        <li>利用規約に違反したユーザーや，不正・不当な目的でサービスを利用しようとするユーザーを特定し，ご利用をお断りするため</li>
        <li>ユーザーにご自身の登録情報の閲覧や変更，削除，ご利用状況の閲覧を行っていただくため</li>
        <li>有料サービスにおいて，ユーザーに利用料金を請求するため</li>
        <li>上記の利用目的に付随する目的</li>
      </ul>

      <h3 class="text-lg font-semibold mb-2 mt-6">第4条（利用目的の変更）</h3>
      <p class="mb-4">
        当社は，利用目的が変更前と関連性を有すると合理的に認められる場合に限り，個人情報の利用目的を変更するものとします。
        利用目的の変更を行った場合には，変更後の目的について，当社所定の方法により，ユーザーに通知し，
        または本ウェブサイト上に公表するものとします。
      </p>

      <h3 class="text-lg font-semibold mb-2 mt-6">第5条（個人情報の第三者提供）</h3>
      <p class="mb-2">
        当社は，次に掲げる場合を除いて，あらかじめユーザーの同意を得ることなく，第三者に個人情報を提供することはありません。
        ただし，個人情報保護法その他の法令で認められる場合を除きます。
      </p>
      <ul class="list-disc pl-6 mb-4 space-y-1">
        <li>人の生命，身体または財産の保護のために必要がある場合であって，本人の同意を得ることが困難であるとき</li>
        <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって，本人の同意を得ることが困難であるとき</li>
        <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって，本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</li>
        <li>
          あらかじめ次の事項を告知あるいは公表し，かつ当社が個人情報保護委員会に届出をしたとき：
          利用目的に第三者への提供を含むこと／第三者に提供されるデータの項目／第三者への提供の手段または方法／
          本人の求めに応じて個人情報の第三者への提供を停止すること／本人の求めを受け付ける方法
        </li>
      </ul>
      <p class="mb-2">前項の定めにかかわらず，次に掲げる場合には，当該情報の提供先は第三者に該当しないものとします。</p>
      <ul class="list-disc pl-6 mb-4 space-y-1">
        <li>当社が利用目的の達成に必要な範囲内において個人情報の取扱いの全部または一部を委託する場合</li>
        <li>合併その他の事由による事業の承継に伴って個人情報が提供される場合</li>
        <li>
          個人情報を特定の者との間で共同して利用する場合であって，その旨並びに共同して利用される個人情報の項目，
          共同して利用する者の範囲，利用する者の利用目的および当該個人情報の管理について責任を有する者の氏名または名称について，
          あらかじめ本人に通知し，または本人が容易に知り得る状態に置いた場合
        </li>
      </ul>

      <h3 class="text-lg font-semibold mb-2 mt-6">第6条（個人情報の開示）</h3>
      <p class="mb-2">
        当社は，本人から個人情報の開示を求められたときは，本人に対し，遅滞なくこれを開示します。
        ただし，開示することにより次のいずれかに該当する場合は，その全部または一部を開示しないこともあり，
        開示しない決定をした場合には，その旨を遅滞なく通知します。
        なお，個人情報の開示に際しては，1件あたり1,000円の手数料を申し受けます。
      </p>
      <ul class="list-disc pl-6 mb-4 space-y-1">
        <li>本人または第三者の生命，身体，財産その他の権利利益を害するおそれがある場合</li>
        <li>当社の業務の適正な実施に著しい支障を及ぼすおそれがある場合</li>
        <li>その他法令に違反することとなる場合</li>
      </ul>
      <p class="mb-4">
        前項の定めにかかわらず，履歴情報および特性情報などの個人情報以外の情報については，原則として開示いたしません。
      </p>

      <h3 class="text-lg font-semibold mb-2 mt-6">第7条（個人情報の訂正および削除）</h3>
      <p class="mb-4">
        ユーザーは，当社の保有する自己の個人情報が誤った情報である場合には，当社が定める手続きにより，
        当社に対して個人情報の訂正，追加または削除（以下，「訂正等」といいます。）を請求することができます。
        当社は，ユーザーから当該請求を受けてその請求に応じる必要があると判断した場合には，遅滞なく，
        当該個人情報の訂正等を行い，その結果をユーザーに通知します。
      </p>

      <h3 class="text-lg font-semibold mb-2 mt-6">第8条（個人情報の利用停止等）</h3>
      <p class="mb-2">
        当社は，本人から，個人情報が以下のいずれかの理由によりその利用の停止または消去
        （以下，「利用停止等」といいます。）を求められた場合には，遅滞なく必要な調査を行います。
      </p>
      <ul class="list-disc pl-6 mb-4 space-y-1">
        <li>個人情報が、利用目的の範囲を超えて取り扱われている</li>
        <li>個人情報が、不正の手段により取得されたものである</li>
        <li>個人情報が、違法又は不当な行為を助長し又は誘発するおそれがある方法で利用された</li>
        <li>保有個人データを事業者が利用する必要がなくなった</li>
        <li>保有個人データの漏えい等が生じた</li>
        <li>その他、保有個人データの取扱いにより、本人の権利利益が害されるおそれがある</li>
      </ul>
      <p class="mb-4">
        前項の調査結果に基づき，当社がその請求に応じる必要があると判断した場合には，遅滞なく，
        当該個人情報の利用停止等を行い，その結果をユーザーに通知します。
        ただし，利用停止等に多額の費用を要する場合その他利用停止等を行うことが困難な場合であって，
        ユーザーの権利利益を保護するために必要なこれに代わるべき措置をとれる場合は，
        この代替策を講じるものとします。
      </p>

      <h3 class="text-lg font-semibold mb-2 mt-6">第9条（プライバシーポリシーの変更）</h3>
      <p class="mb-4">
        本ポリシーの内容は，法令その他本ポリシーに別段の定めのある事項を除いて，
        ユーザーに通知することなく，変更することができるものとします。
        当社が別途定める場合を除いて，変更後のプライバシーポリシーは，
        本ウェブサイトに掲載したときから効力を生じるものとします。
      </p>

      <h3 class="text-lg font-semibold mb-2 mt-6">タイ王国における当社の規定</h3>
      <p class="mb-4">
        本規定には、タイ王国が定める個人データ保護法（以下、PDPAといいます。）に基づき、
        PDPAの適用がある場合に当社がタイ在住のユーザーに提供することを義務付けられている特定の追加情報および
        現地の準拠法に準じた個人情報の取扱いに関するユーザーの権利について記載しています。
        本規定とプライバシーポリシー本文の条項に矛盾がある場合は，本規定が優先されます。
      </p>

      <h4 class="text-base font-semibold mb-2 mt-4">個人情報の取扱い</h4>
      <p class="mb-4">
        当社がユーザーの個人情報を取り扱う方法および目的、保存期間、当社が取り扱うユーザーの個人情報の種類、
        ならびにユーザーの個人情報の第三者への提供については、上記のプライバシーポリシーに記載した通りです。
      </p>

      <h4 class="text-base font-semibold mb-2 mt-4">法的根拠</h4>
      <p class="mb-4">
        当社の個人情報の利用は、原則としてユーザーの同意をその法的根拠としています。
        ユーザーの同意がない場合における個人情報の利用は、ユーザーとの契約の履行のための必要性、
        契約締結前のユーザーの求めに応じた手続きの実行のための必要性、当社もしくは第三者によって求められる
        正当な利益のための必要性、または当社が従うべき法的義務を遵守するための必要性をその法的根拠としています。
        当社または第三者によって求められる正当な利益には、マーケティングおよびサービスの改善等による営業利益の増加等、
        ならびに当社のウェブサイトにおける利便性およびセキュリティの向上等が該当します。
      </p>

      <h4 class="text-base font-semibold mb-2 mt-4">個人情報の第三国への移転</h4>
      <p class="mb-4">
        当社は、ユーザーとの契約の履行のため、または契約締結前のユーザーの求めに応じた手続きの履践のために、
        日本国以外で取得した個人情報を日本国または第三国へ移転することがあります。
        ユーザーの個人情報を第三国へ移転する場合、当社は適切なセキュリティ及び秘密保持の措置を用いて
        ユーザーの個人情報を取り扱います。
      </p>

      <h4 class="text-base font-semibold mb-2 mt-4">ユーザーの権利</h4>
      <p class="mb-2">
        ユーザーは、当社に対して法令等に基づく以下の権利を有しています。
        ユーザーは、個人情報保護に関する問い合わせ窓口に連絡することにより、これらの権利を行使することができます。
      </p>
      <ul class="list-disc pl-6 mb-4 space-y-1">
        <li>個人情報へのアクセスの権利</li>
        <li>個人情報の訂正の権利</li>
        <li>個人情報の消去の権利</li>
        <li>個人情報の利用の制限の権利</li>
        <li>個人情報の利用への異議申立ての権利</li>
        <li>データポータビリティの権利</li>
      </ul>
      <p class="mb-4">
        当社は、これらの権利の行使を受けた場合には、法令等に定められた例外事由に該当しない限り、
        ユーザーであることを確認した上で誠実に対応します。
      </p>

      <h4 class="text-base font-semibold mb-2 mt-4">同意の撤回</h4>
      <p class="mb-4">
        ユーザーは、いつでも個人情報の利用に関する同意を撤回できます。
        その同意の撤回は、撤回前の同意に基づく個人情報の利用の合法性に影響を与えません。
        ユーザーは、個人情報保護に関する問い合わせ窓口に連絡することにより、同意を撤回することができます。
      </p>

      <h4 class="text-base font-semibold mb-2 mt-4">監督機関への不服申し立て</h4>
      <p class="mb-4">
        ユーザーは、当社の個人情報の取扱いについて、法令等に従って、国、地域または国際組織等の監督機関に
        不服を申し立てることができます。
      </p>

      <h4 class="text-base font-semibold mb-2 mt-4">サービス提供のために必要な個人情報</h4>
      <p class="mb-2">当社は、ユーザーに対してサービスを提供するために、以下の情報を必要とします。</p>
      <ul class="list-disc pl-6 mb-4 space-y-1">
        <li>基本情報（会社名、氏名、電話番号等）</li>
        <li>ウェブサイト制作において必要となる全ての情報</li>
      </ul>

      <h4 class="text-base font-semibold mb-2 mt-4">プロファイリングなどの自動化された意思決定</h4>
      <p class="mb-4">
        当社は、個人情報のプロファイリングなどの自動化された取扱いのみに基づいた意思決定を行うことはありません。
      </p>
    `,
  },
//};

type props ={
  selectedLanguage?: any;
}

const  PDPAPage =(props:props)=> {
 
  // const languageOptions = [
  //   { code: 'TH', label: 'ภาษาไทย' },
  //   { code: 'JP', label: '日本語' },
  // ];
  //const [selectedLanguage, setSelectedLanguage] = useState(props.selectedLanguage);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageDropdownRef = useRef(null);
  //const [translations, setTranslations] = useState(defaultTranslations);
  const [isLoading, setIsLoading] = useState(true);
  const { isAccepted, toggleConsent } = useConsent();
  const { isActionCared, toggleActionCared} = useActionCared();
  
  const {language, toggleLanguage} = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const t = translations[selectedLanguage.code];

useEffect(() => {
  setSelectedLanguage(language);
}, [language]);

  // Load PDPA content from Firebase
  useEffect(() => {
    const loadPdpaContent = async () => {
      try {
        setIsLoading(true);
        const docRef = doc(db, 'pdpaContent', 'active');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.content) {
            // Generate HTML content from structured data
            const generateContent = (lang) => {
              const content = data.content[lang];
              if (!content) return '';
              
              const sectionLabels = {
                TH: {
                  section1: 'การเก็บรวบรวมข้อมูล',
                  section2: 'การใช้ข้อมูล',
                  section3: 'การเปิดเผยข้อมูล',
                  section4: 'สิทธิของท่าน',
                },
                JP: {
                  section1: 'データの収集',
                  section2: 'データの使用',
                  section3: 'データの開示',
                  section4: 'お客様の権利',
                },
              };
              
              return `
                <h2 class="text-xl font-bold mb-4">${content.subtitle || ''}</h2>
                <p class="mb-4">${content.intro || ''}</p>
                
                <h3 class="text-lg font-semibold mb-2 mt-6">1. ${sectionLabels[lang]?.section1 || ''}</h3>
                <p class="mb-4">${content.section1 || ''}</p>
                
                <h3 class="text-lg font-semibold mb-2 mt-6">2. ${sectionLabels[lang]?.section2 || ''}</h3>
                <p class="mb-4">${content.section2 || ''}</p>
                
                <h3 class="text-lg font-semibold mb-2 mt-6">3. ${sectionLabels[lang]?.section3 || ''}</h3>
                <p class="mb-4">${content.section3 || ''}</p>
                
                <h3 class="text-lg font-semibold mb-2 mt-6">4. ${sectionLabels[lang]?.section4 || ''}</h3>
                <p class="mb-4">${content.section4 || ''}</p>
              `;
            };
            
            // const newTranslations = {
            //   TH: {
            //     ...defaultTranslations.TH,
            //     title: data.content.TH?.title || defaultTranslations.TH.title,
            //     content: generateContent('TH') || defaultTranslations.TH.content,
            //   },
            //   JP: {
            //     ...defaultTranslations.JP,
            //     title: data.content.JP?.title || defaultTranslations.JP.title,
            //     content: generateContent('JP') || defaultTranslations.JP.content,
            //   },
            // };
            
            // setTranslations(newTranslations);
          }
        }
      } catch (error) {
        console.error('Error loading PDPA content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPdpaContent();
  }, []);
  const currentFontClass =
    selectedLanguage.code === 'JP' ? sawarabiFont.className : promptFont.className;


  const [isAcceptedPDPA, setIsAcceptedPDPA] = useState(isAccepted);
  useEffect(() => {
    setIsAcceptedPDPA(isAccepted);
  }, [isAccepted]);

  return (
    <div
      className={` -mt-5 ${currentFontClass}`}
    >
      <div className="w-full  max-w-[390px] sm:max-w-[450px] md:max-w-[500px] min-h-screen sm:min-h-[600px] md:min-h-[700px]  flex flex-col relative shadow-sm sm:shadow-none overflow-y-auto">

        {/* Content */}
        <div className="flex-1 flex flex-col px-4 sm:px-4 md:px-8 lg:px-12 py-4 sm:py-6 md:py-8 overflow-y-auto">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : (
            <>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                {t.pdpaTitle}
              </h1>
              <div 
                className="text-xs sm:text-sm md:text-base text-gray-700 leading-relaxed mb-6"
            dangerouslySetInnerHTML={{ __html: t.pdpaContent }}
          />

          <div  className="mt-auto gitflex flex-col gap-4 pb-6">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={isAcceptedPDPA}
                onChange={(e) => setIsAcceptedPDPA(e.target.checked)}
                    className="mt-1 w-3.5 h-3.5 sm:w-4 sm:h-4 border-gray-300 rounded text-gray-900 focus:ring-gray-900"
              />
              <span className="text-sm text-gray-700">
                {t.pdpaAcceptLabel}
              </span>
            </label>
            <button
              type="submit"
              disabled={!isAcceptedPDPA}
              onClick={() => {
                toggleConsent(isAcceptedPDPA);
                toggleActionCared(false)
              }}
                  className="w-full mt-5 bg-gray-800 text-white py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.pdpaAcceptButton}
            </button>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PDPAPage;