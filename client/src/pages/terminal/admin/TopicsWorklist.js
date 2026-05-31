import StubPage from '../../../components/terminal/StubPage';

export default function AdminTopicsWorklistPage() {
  return (
    <StubPage
      title="Topics — работна листа"
      subtabs={['Чекаат уредничка проверка', 'Одобрени', 'Одбиени']}
      blurb="Преглед на одговорите на Studio корисниците пред објава на Topics.nexa. (Корисничкиот интерфејс се гради во следниот чекор.)"
      showTrialNotice={false}
    />
  );
}
