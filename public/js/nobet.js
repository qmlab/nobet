var Page = React.createClass({
  getInitialState: function() {
    return {data: []}
  },
  componentDidMount: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      success: function(data) {
        this.setState({data: data})
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString())
      }.bind(this)
    })
  },
  render: function() {
    return (
      <div className='Page'>
        <SearchBox />
        <RecordList data={this.state.data} />
      </div>
    )
  }
})

var SearchBox = React.createClass({
  render: function() {
    return (
      <div className='SearchBox'>
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
    return (
      <div className='Record'>
        <h2>{betItem.Teams[0].Name.replace(/_/g, ' ')} vs {betItem.Teams[1].Name.replace(/_/g, ' ')} @ {betItem.MatchDate} by {betItem.BookMaker}</h2>
        <p>Odds : {betItem.Odds.Win}/{betItem.Odds.Draw}/{betItem.Odds.Lose}</p>
        <p>Decision: {decision}</p>
        <p>ROI: {toPercent(ROI)}</p>
      </div>
    )
  }
})

React.render(
  <Page url='/records'/>,
  document.getElementById('container')
)
