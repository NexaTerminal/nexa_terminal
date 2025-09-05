
<% if (agreementDurationChange) {%>
<p> Предмет на изнена на овој анекс е измена на времетраењето на договорот за вработување</p>
<p> Договорот за вработување ќе престане на <%-endDate%> година </p>
<%}%>
<% if (basicSalary) {%>
<p> Предмет на изнена на овој анекс е измена на основната плата наведена во договорот за вработување</p>
<%}%>



<h5 style="text-align: center; font-weight: bold">АНЕКС </h5>
<h7 style="text-align: center; font-weight: bold">кон ДОГОВОР ЗА ВРАБОТУВАЊЕ БР.  <%-agreementNo%> </h7>

<p style="text-align: justify; font-weight: bold">Склучен во Скопје на <%- annexDate%> година, помеѓу </p>
<p style="text-align: justify; font-weight: normal">1.	<%-companyName%> со седиште на ул. <%-companyAddress%>, Република Северна Македонија, со ЕМБС <%-companyNumber%>, претставувано од <%-companyManager%>, како работодавач (во понатамошниот текст: Работодавачот); и
<p style="text-align: justify; font-weight: normal">2.	<%-employeeName%> со адреса на живеење на ул. <%-employeeAddress%> со ЕМБГ <%-employeePIN%>, како работник (во натамошниот текст  “работник”)

<% if (agreementDuration) {%>
<p style="text-align: center; font-weight: bold">Член 1
<p style="text-align: justify; font-weight: normal"> Предмет на изнена на овој анекс е измена на времетраењето на договорот за вработување.</p>
<p style="text-align: center; font-weight: bold">Член 2
<p style="text-align: justify; font-weight: normal"> Договорот за вработување ќе престане на <%-endDate%> година. </p>
<%}%>
<% if (basicSalary) {%>
<p style="text-align: center; font-weight: bold">Член 1
<p style="text-align: justify; font-weight: normal">Предмет на изнена на овој анекс е измена на основната плата наведена во договорот за вработување.</p>
<p style="text-align: center; font-weight: bold">Член 2
<p style="text-align: justify; font-weight: normal"> Основната плата на работникот ќе изнесува <%-newBasicSalary%> денари. </p>
<%}%>
<% if (jobPosition) {%><p style="text-align: center; font-weight: bold">Член 1
<p style="text-align: justify; font-weight: normal"> Предмет на изнена на овој анекс е измена на работната позиција наведена во договорот за вработување.</p>
<p style="text-align: center; font-weight: bold">Член 2
<p style="text-align: justify; font-weight: normal">Работникот ќе ги извршува работите и работните задачи за позицијата <%-newJobPosition%> денари. </p>
<%}%>
<% if (otherAgreementChange) {%>
<p style="text-align: center; font-weight: bold">Член 1
<p style="text-align: justify; font-weight: normal"> Врз основа на овој анекс, се изменува <%-changedArticle%>. </p>
<p style="text-align: center; font-weight: bold">Член 2
<p style="text-align: justify; font-weight: normal"> Новиот текст на <%-changedArticle%>, сега ќе гласи <%-otherAgreementChangeContent%>.</p>
<%}%>

<p style="text-align: center; font-weight: bold">Член 3
<p style="text-align: justify; font-weight: normal">Останатите одредби од Договорот за вработување помеѓу работникот и работодавачот остануваат непроменети. 

<p style="text-align: center; font-weight: bold">Член 4
<p style="text-align: justify; font-weight: normal">За се што не е предвидено со овој Анекс ќе се применуваат одредбите од Законот за работните односи и останатите позитивни прописи.

<p style="text-align: center; font-weight: bold">Член 5
<p style="text-align: justify; font-weight: normal">Овој Анекс е составен во 2 (два) примероци, по 1 (еден) примерок за секоја договорна страна. 

<div style="text-align: center">
<table style="width:200%" >
  <tr>
    <th>Работодавач</th>
    <th>Работник</th>
  </tr>
  <tr>
    <th>________________</th>
    <th>________________</th>
  </tr>
  <tr>
    <td><%=companyName%> <%-companyManager%></td>
    <td><%-employeeName%></td>
  </tr>
</table>
</div>

