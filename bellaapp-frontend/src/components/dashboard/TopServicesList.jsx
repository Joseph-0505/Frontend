import "../../styles/dashboard/service-list.css";

export default function TopServicesList({ topServicos }) {
  return (
    <article className="panel">
      <h2>Servicos mais agendados</h2>
      <ul className="service-list">
        {topServicos.length === 0 ? <li>Sem dados de servicos ainda.</li> : null}
        {topServicos.map((service) => (
          <li key={service.servicoNome}>
            <div className="service-head">
              <span>{service.servicoNome}</span>
              <strong>{service.quantidade}</strong>
            </div>
            <div className="meter">
              <span style={{ width: `${service.percentual}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
