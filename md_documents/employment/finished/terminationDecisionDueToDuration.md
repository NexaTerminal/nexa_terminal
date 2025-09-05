<!-- > > > /mern-document-generator "can you make the code with the standard automated documents flow for the termination Decision due to duration. It is a 
  employment type document, it should go in that folder. The user would provide the employee name, job position, employment end date, date of the 
  decision, employee's agreement date. Based on this documents, make the front end, preview, routes, backend code with controller and other, same as the 
  other. Also, make the link for this one, use the flow as the other automated documents. For the content, use the following 
  '/Users/martinboshkoski/Desktop/nexa temrinal (github clone)/nexa.v1/md_documents/employment/terminationDecisionDueToDuration.md'" -->

<p style="text-align: justify; font-weight: normal">Врз основа на член 46, член 62 став 1 точка 1 и член 64 од Законот за работните односи, (Службен весник на Република Македонија бр.  167/15 Пречистен текст и подоцнежните измени на законот), работодавачот, <%=companyName%>, со седиште на ул. <%=companyAddress%>, претставувано од <%=companyManager%>, на ден <%=decisionDate%>година, ја донесе следната:

<h6 style="text-align: center; font-weight: bold">    ОДЛУКА </h6>
<p style="text-align: center; font-weight: bold">за престанок на Договорот за вработување поради истек на времето за кое бил склучен</p>


<p style="text-align: justify; font-weight: normal">На вработениот <%=employeeName%>, вработен на работна позиција <%=jobPosition%>, на ден <%=employmentEndDate%>  година, му престанува работниот однос поради истек на времето на договорот за вработување. 

<p style="text-align: center; font-weight: bold">Образложение
<p style="text-align: justify; font-weight: normal"><%=companyName%>, како работодавач и <%=employeeName%>е како работник, на ден <%=agreementDate%> година, склучија Договор за вработување на определено време (во понатамошниот текст: Договорот).

<p style="text-align: justify; font-weight: normal">Согласно Договорот, е наведено дека истиот е склучен на определено времетраење. 
<p style="text-align: justify; font-weight: normal">Согласно на ова, а врз основа на член 64 од Законот за работните односи со кој е предвидено дека: 
<p style="text-align: justify; font-weight: normal">Договорот за вработување на определено работно време престанува да важи со изминувањето на рокот за којшто бил склучен, односно кога договорената работа е завршена или со престанувањето на причината заради којашто бил склучен. 

<p style="text-align: justify; font-weight: normal">Врз основа на горенаведеното, вработениот се ослободува од обврската за извшување на работи и работни задачи во корист на работодавачот после <%=employmentEndDate%> година.

<p style="text-align: justify; font-weight: normal"><%=decisionDate%> година.
<br>
<br>
<br>
<table data-pdfmake='{"widths":[250, 250]}'>
        <tr style="border: none">
            <td style="text-align: left;">
                <div>___________________________</div>
                <p>  <%= companyName %>
                <p>  <%=companyManager%> %>
            </td>
        </tr>
</table>


