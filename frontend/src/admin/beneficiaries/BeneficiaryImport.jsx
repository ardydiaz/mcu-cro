import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  HiArrowLeft,
  HiOutlineArrowDownTray,
  HiOutlineArrowUpTray,
  HiOutlineCheckCircle,
  HiOutlineDocumentText,
  HiOutlineExclamationTriangle,
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
} from 'react-icons/hi2'
import { getImportTemplate, importBeneficiaries } from '../../api/admin.api.js'

const STATUS = {
  ready: { label: 'Ready', Icon: HiOutlineCheckCircle },
  problem: { label: 'Needs fixing', Icon: HiOutlineExclamationTriangle },
  duplicate: { label: 'Already registered', Icon: HiOutlineUserGroup },
}

// /admin/beneficiaries/import — requirements Step 8 (Data Migration): bring in
// beneficiary lists kept in Excel. The file is checked first; nothing is saved
// until the administrator confirms, and only rows without problems are saved.
export default function BeneficiaryImport() {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null) // { summary, rows }
  const [busy, setBusy] = useState('') // '' | 'template' | 'checking' | 'importing'
  const [error, setError] = useState('')
  const [consent, setConsent] = useState(false)
  const [onlyIssues, setOnlyIssues] = useState(false)

  async function downloadTemplate() {
    setBusy('template')
    setError('')
    try {
      const blob = await getImportTemplate()
      const url = URL.createObjectURL(blob)
      const link = Object.assign(document.createElement('a'), { href: url, download: 'beneficiaries-import-template.xlsx' })
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  async function check(chosen) {
    setFile(chosen)
    setResult(null)
    setConsent(false)
    setOnlyIssues(false)
    setError('')
    setBusy('checking')
    try {
      const checked = await importBeneficiaries(chosen)
      setResult(checked)
      setOnlyIssues(checked.summary.ready < checked.summary.total)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  async function commit() {
    setBusy('importing')
    setError('')
    try {
      const { imported, skipped } = await importBeneficiaries(file, { commit: true, consent })
      const notice = `${imported.toLocaleString()} ${imported === 1 ? 'beneficiary was' : 'beneficiaries were'} imported.${
        skipped ? ` ${skipped.toLocaleString()} ${skipped === 1 ? 'row was' : 'rows were'} skipped.` : ''
      }`
      navigate('/admin/beneficiaries', { state: { notice } })
    } catch (err) {
      setError(err.message)
      setBusy('')
    }
  }

  function reset() {
    setFile(null)
    setResult(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const rows = result ? (onlyIssues ? result.rows.filter((r) => r.status !== 'ready') : result.rows) : []

  return (
    <div className="admin-page">
      <Link to="/admin/beneficiaries" className="back-link">
        <HiArrowLeft aria-hidden="true" /> Beneficiaries
      </Link>
      <div className="admin-page__header">
        <h1>Import beneficiaries</h1>
        <p>Bring in beneficiary lists kept in Excel. The file is checked first; nothing is saved until you confirm.</p>
      </div>

      <ol className="import-steps">
        <li className="form-card">
          <span className="import-steps__num">1</span>
          <div>
            <h2>Download the template</h2>
            <p>
              It has the right columns, drop-downs for sex, barangay and other fields, and instructions. You can also
              upload your own file if its headings match (Last name, First name, Birth date, Sex, Barangay…).
            </p>
            <button type="button" className="btn btn--outline" onClick={downloadTemplate} disabled={busy === 'template'}>
              <HiOutlineArrowDownTray aria-hidden="true" /> {busy === 'template' ? 'Preparing…' : 'Download template (.xlsx)'}
            </button>
          </div>
        </li>

        <li className="form-card">
          <span className="import-steps__num">2</span>
          <div>
            <h2>Upload the filled-in file</h2>
            <p>Excel workbook (.xlsx) or CSV, up to 2,000 rows and 5 MB.</p>
            <input
              ref={inputRef}
              id="import-file"
              type="file"
              accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              className="visually-hidden"
              onChange={(e) => e.target.files[0] && check(e.target.files[0])}
            />
            <label htmlFor="import-file" className={`import-drop${busy === 'checking' ? ' is-busy' : ''}`}>
              {file ? <HiOutlineDocumentText aria-hidden="true" /> : <HiOutlineArrowUpTray aria-hidden="true" />}
              <span>{busy === 'checking' ? 'Checking the file…' : file ? file.name : 'Choose a file'}</span>
              <small>{file ? 'Choose another file to check it instead' : 'Nothing is saved at this step'}</small>
            </label>
          </div>
        </li>
      </ol>

      {error && (
        <p className="admin-alert" role="alert">
          {error}
        </p>
      )}

      {result && (
        <section className="admin-panel data-panel" aria-labelledby="check-title">
          <div className="data-panel__top">
            <div>
              <h2 id="check-title">Check results</h2>
              <p className="data-panel__meta">
                {result.summary.total.toLocaleString()} {result.summary.total === 1 ? 'row' : 'rows'} in {file.name}
              </p>
            </div>
            <ul className="import-summary">
              {Object.entries(STATUS).map(([status, { label, Icon }]) => (
                <li key={status} className={`import-status import-status--${status}`}>
                  <Icon aria-hidden="true" /> <strong>{result.summary[status].toLocaleString()}</strong> {label.toLowerCase()}
                </li>
              ))}
            </ul>
          </div>

          {result.summary.ready < result.summary.total && (
            <label className="import-filter">
              <input type="checkbox" checked={onlyIssues} onChange={(e) => setOnlyIssues(e.target.checked)} />
              Show only rows that won't be imported
            </label>
          )}

          <div className="import-table-wrap">
            <table className="data-table import-table">
              <thead>
                <tr>
                  <th scope="col">Row</th>
                  <th scope="col">Name</th>
                  <th scope="col">Birth date</th>
                  <th scope="col">Barangay</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const { label, Icon } = STATUS[r.status]
                  return (
                    <tr key={r.row}>
                      <td data-label="Row" className="data-table__muted">
                        {r.row}
                      </td>
                      <td data-label="Name">{r.name || <em className="data-table__muted">No name</em>}</td>
                      <td data-label="Birth date">{r.birthDate ?? '—'}</td>
                      <td data-label="Barangay">{r.barangay ?? '—'}</td>
                      <td data-label="Status">
                        <span className={`import-status import-status--${r.status}`}>
                          <Icon aria-hidden="true" /> {label}
                        </span>
                        {r.messages.length > 0 && (
                          <ul className="import-messages">
                            {r.messages.map((m) => (
                              <li key={m}>{m}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="import-confirm">
            {result.summary.ready > 0 ? (
              <>
                <label className="check-field">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                  <span>
                    <strong>Everyone in this file (or their guardian) consented to their data being collected.</strong>
                    <small>Required under the Data Privacy Act of 2012 (RA 10173).</small>
                  </span>
                </label>
                <p className="import-confirm__note">
                  <HiOutlineShieldCheck aria-hidden="true" />
                  {result.summary.ready < result.summary.total
                    ? `Rows that need fixing or are already registered are skipped. Fix them in the file and import it again later.`
                    : 'All rows are ready.'}
                </p>
                <div className="import-confirm__actions">
                  <button type="button" className="btn btn--outline" onClick={reset}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn--purple" onClick={commit} disabled={!consent || busy === 'importing'}>
                    {busy === 'importing'
                      ? 'Importing…'
                      : `Import ${result.summary.ready.toLocaleString()} ${result.summary.ready === 1 ? 'beneficiary' : 'beneficiaries'}`}
                  </button>
                </div>
              </>
            ) : (
              <p className="import-confirm__note">
                <HiOutlineExclamationTriangle aria-hidden="true" /> No rows are ready to import. Fix the rows listed above in
                your file, then upload it again.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
