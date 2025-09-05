<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 1%" />
<col style="width: 9%" />
<col style="width: 9%" />
<col style="width: 10%" />
<col style="width: 10%" />
<col style="width: 11%" />
<col style="width: 19%" />
</colgroup>
<tbody>
<tr class="odd">
<td colspan="2">Податок кој user-от го внесува</td>
<td>Назив на варијабила во код</td>
<td>Вид на инпут / задолжителност</td>
<td>Услов (за да постои)</td>
<td>FE operation</td>
<td>BE operation (if true)</td>
<td>Забелешка / Регулатива</td>
</tr>
<tr class="even">
<td></td>
<td colspan="7">Податоци за работодавачот – АВТОМАТСКИ ГЕНЕРИРАНИ ВО
ЗАВИСНОСТ ОД USER</td>
</tr>
<tr class="odd">
<td colspan="2">Назив на работодавач</td>
<td>&lt;%-locals.companyName%&gt;</td>
<td><p>String | text</p>
<p><em><strong>Mandatory field</strong></em></p></td>
<td></td>
<td></td>
<td>/</td>
<td></td>
</tr>
<tr class="even">
<td colspan="2">Адреса на седиште на работодавач (улица, број и
град)</td>
<td>&lt;%-locals.companyAddress%&gt;</td>
<td><p>String | text</p>
<p><em><strong>Mandatory field</strong></em></p></td>
<td></td>
<td></td>
<td>/</td>
<td>Дали податокот да вклучува – улица, број, град, или овие да бидат
посебни инпути.</td>
</tr>
<tr class="odd">
<td colspan="2">ЕМБС на работодавач</td>
<td>&lt;%-locals.companyNumber%&gt;</td>
<td><p>String | text</p>
<p><em><strong>Mandatory field</strong></em></p></td>
<td></td>
<td>if (companyNumber.lenght !== 7) {return}</td>
<td>/</td>
<td>ЕМБС на секое правно лице има точно седум цифри</td>
</tr>
<tr class="even">
<td colspan="2">Име и презиме на Управител</td>
<td>&lt;%-locals.companyManager%&gt;</td>
<td><p>String | text</p>
<p><em><strong>Mandatory field</strong></em></p></td>
<td></td>
<td></td>
<td>/</td>
<td></td>
</tr>
<tr class="odd">
<td></td>
<td colspan="7">Податоци за работникот</td>
</tr>
<tr class="even">
<td colspan="2"></td>
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td colspan="2">Име и презиме на работник</td>
<td>&lt;%-locals.employeeName%&gt;</td>
<td><p>String | text</p>
<p><em><strong>Mandatory field</strong></em></p></td>
<td></td>
<td></td>
<td>/</td>
<td></td>
</tr>
<tr class="even">
<td colspan="2">Работна позиција</td>
<td>&lt;%-locals. jobPosition%&gt;</td>
<td><p>String | text</p>
<p><em><strong>Mandatory field</strong></em></p></td>
<td></td>
<td></td>
<td>/</td>
<td></td>
</tr>
<tr class="odd">
<td></td>
<td colspan="7">Податоци за висината и времетраењето на дисциплинската
мерка – парична казна</td>
</tr>
<tr class="even">
<td colspan="2"></td>
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td colspan="2">Датум на изрекување на казната</td>
<td>&lt;%-locals.sanctionDate%&gt;</td>
<td><p>String | text</p>
<p><em><strong>Mandatory field</strong></em></p></td>
<td></td>
<td></td>
<td></td>
<td>Доколку ова поле не е внесено, да се внесува датумот на кој се
користи апликацијата за да се генерира ваков документ.</td>
</tr>
<tr class="even">
<td colspan="2">Висина на казната</td>
<td>&lt;%-locals. sanctionAmount %&gt;</td>
<td><p>Dropdown | text</p>
<p><em><strong>Mandatory field</strong></em></p></td>
<td></td>
<td>if (sanctionAmount.lenght !== 15) {return}</td>
<td></td>
<td><p>Не може да се изрече повисока казна од 15% месечно на нето
плата.</p>
<p>Да се</p></td>
</tr>
<tr class="odd">
<td colspan="2">Месеци за кои се изрекува казната</td>
<td>&lt;%-locals. sanctionPeriod %&gt;</td>
<td><p>String | text</p>
<p><em><strong>Mandatory field</strong></em></p></td>
<td></td>
<td>if (sanctionPeriod.lenght !== 6) {return}</td>
<td></td>
<td>Не може да се изрече повисока казна од подолго од 6 месеци</td>
</tr>
<tr class="even">
<td></td>
<td colspan="7">Податоци за видот на прекршокот</td>
</tr>
<tr class="odd">
<td colspan="2"></td>
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td colspan="2">Обврска која работникот ја запоставил</td>
<td>&lt;%-locals.workTaskFailure%&gt;</td>
<td><p>String | text</p>
<p><em><strong>Mandatory field</strong></em></p></td>
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td colspan="2">Висина на казната</td>
<td>&lt;%-locals. sanctionAmount %&gt;</td>
<td><p>String | text</p>
<p><em><strong>Mandatory field</strong></em></p></td>
<td></td>
<td>if (sanctionAmount.lenght !== 15) {return}</td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td colspan="2">Постапување на работникот спротивно на обврската</td>
<td>&lt;%-locals. employeeWrongDoing %&gt;</td>
<td><p>String | text</p>
<p><em><strong>Mandatory field</strong></em></p></td>
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td colspan="2">Датум на постапување на работникот спротивно на
обврската</td>
<td>&lt;%-locals. employeeWrongdoingDate %&gt;</td>
<td><p>String | text</p>
<p><em><strong>Mandatory field</strong></em></p></td>
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
</tbody>
</table>
