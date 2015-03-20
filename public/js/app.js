var Page = React.createClass({
  search: function(query) {
    $.ajax({
      url: this.props.url,
      type: 'POST',
      data: query,
      dataType: 'json',
      success: function(data) {
        this.setState({data: data})
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString())
      }.bind(this)
    })
  },
  getInitialState: function() {
    return {data: []}
  },
  componentDidMount: function() {
    this.search({})
  },
  render: function() {
    return (
      <div className='Page'>
        <SearchBox onSubmit={this.search}/>
        <RecordList data={this.state.data} />
      </div>
    )
  }
})

var SearchBox = React.createClass({
  getInitialState: function() {
    return { isChecked: false }
  },
  onCheckedChange: function() {
    this.setState({ isChecked: !this.state.isChecked })
  },
  handleSubmit: function(e) {
    e.preventDefault()
    var text = this.refs.searchText.getDOMNode().value
    var queries = text.split(/[ \t]+/).map(function(query) {
      return '{"BetItem.Teams.Name":{"$regex": "' + query + '", "$options" : "imsx"}}'
    })
    var combinedQuery = '{"$or": ['
    var count = 0
    queries.forEach(function(query) {
      if (count > 0) {
        combinedQuery += ','
      }
      combinedQuery += query
      count++
    })
    combinedQuery += ']}'
    if (this.state.isChecked) {
      combinedQuery = '{"$and":[' + combinedQuery + ', {"$or":[{"BetItem.Result":{"$exists":false}}, {"BetItem.Result":"Unknown"}]}]}'
    }
    this.props.onSubmit(combinedQuery)
  },
  render: function() {
    return (
      <div className='SearchBox'>
        <form className='SearchBoxForm' onSubmit={this.handleSubmit}>
          <label className='aria-lable'>What to search?</label>
          <div className="input-group input-group-lg">
            <input type='text' className='SearchText form-control' placeholder='search all' maxLength='128' ref='searchText' />
            <span className='input-group-btn'>
              <button className='btn btn-default' type='button'>Search</button>
            </span>
          </div>
          <div className='checkbox'>
            <label>
              <input type='checkbox' ref='showFutureOnly' checked={this.state.isChecked} onChange={this.onCheckedChange}> Future Only</input>
            </label>
          </div>
        </form>
      </div>
    )
  }
})

var RecordList = React.createClass({
  render: function() {
    var recordNodes = this.props.data.map(function (record) {
      return (
        <Record data={record} />
      )
    })
    return (
      <div className='RecordList'>
        {recordNodes}
      </div>
    )
  }
})

var Record = React.createClass({
  render: function() {
    var betItem = this.props.data.BetItem
    var decision = this.props.data.Decision
    var ROI = this.props.data.ROI
    var result = 'N/A'
    if (typeof this.props.data.BetItem.Result != 'undefined') {
      result = this.props.data.BetItem.Result
    }
    return (
      <div className='Record'>
        <h2>{betItem.Teams[0].Name.replace(/_/g, ' ')} vs {betItem.Teams[1].Name.replace(/_/g, ' ')} @ {betItem.MatchDate} by {betItem.BookMaker}</h2>
        <p>Odds : {betItem.Odds.Win} / {betItem.Odds.Draw} / {betItem.Odds.Lose}</p>
        <p>Decision: <b>{decision}</b></p>
        <p>ROI: {toPercent(ROI)}</p>
        <p>Result: <b>{result}</b></p>
      </div>
    )
  }
})

React.render(
  <Page url='/records'/>,
  document.getElementById('container')
)
